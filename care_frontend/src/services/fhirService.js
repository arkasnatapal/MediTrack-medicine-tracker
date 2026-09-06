import axios from 'axios';

const API_BASE = 'http://localhost:5001/fhir';

const getAuthHeaders = () => {
  const token = localStorage.getItem('care_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fhirService = {
  getResource: async (resourceType, id) => {
    try {
      const response = await axios.get(`${API_BASE}/${resourceType}/${id}`, { headers: getAuthHeaders() });
      return response.data;
    } catch (err) {
      console.warn(`Error fetching ${resourceType}/${id}:`, err.message);
      return null;
    }
  },

  searchResources: async (resourceType, params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/${resourceType}`, {
        params,
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      console.warn(`Error searching ${resourceType}:`, err.message);
      return { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] };
    }
  },

  getPatientEverythingBundle: async (patientId) => {
    try {
      const response = await axios.get(`${API_BASE}/Patient/${patientId}/$everything`, { headers: getAuthHeaders() });
      return response.data;
    } catch (err) {
      console.warn(`Error exporting $everything bundle:`, err.message);
      return null;
    }
  },

  importBundle: async (fhirJson) => {
    try {
      const response = await axios.post(`${API_BASE}/Bundle/import`, fhirJson, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/fhir+json'
        }
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.issue?.[0]?.diagnostics || err.message);
    }
  }
};

export default fhirService;

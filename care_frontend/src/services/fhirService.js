import axios from 'axios';

const getFhirBaseUrl = () => {
  if (import.meta.env.VITE_FHIR_API_BASE_URL) return import.meta.env.VITE_FHIR_API_BASE_URL;
  if (import.meta.env.VITE_CARE_API_BASE_URL) return import.meta.env.VITE_CARE_API_BASE_URL.replace(/\/api\/?$/, '/fhir');
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001/fhir';
  }
  return '/fhir';
};

const API_BASE = getFhirBaseUrl();

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

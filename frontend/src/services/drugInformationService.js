import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const drugInformationService = {
  getDrugInfo: async (query) => {
    try {
      const response = await axios.get(`${API_BASE}/care-network/drugs?query=${encodeURIComponent(query)}`);
      if (response.data && response.data.success) {
        return response.data.drug;
      }
    } catch (err) {
      console.warn('Backend drug info endpoint error, using client fallback:', err);
    }

    return {
      providerMode: 'DEMO DRUG KNOWLEDGE PROVIDER',
      isRealProviderUsed: false,
      brandName: query.toUpperCase(),
      genericName: `${query} Generic`,
      dosageForm: 'Oral Tablet / Capsule',
      indications: 'Prescription medicine indicated for therapeutic clinical care.',
      warnings: 'Use strictly as directed by registered medical practitioners.',
      adverseReactions: 'Consult physician if rash, nausea, or dizziness occurs.',
      disclaimer: 'General reference only. Not personalized medical advice.'
    };
  }
};

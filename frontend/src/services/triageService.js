import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const triageService = {
  evaluateSymptoms: async ({ symptoms = [], freeTextDescription = '', age = 30, gender = 'male' }) => {
    try {
      const response = await axios.post(`${API_BASE}/care-network/triage`, {
        symptoms,
        freeTextDescription,
        age,
        gender
      });

      if (response.data && response.data.success) {
        return response.data.triage;
      }
    } catch (err) {
      console.warn('Backend triage endpoint unavailable, executing frontend fallback engine:', err);
    }

    // Pure Client-side Fallback Triage Engine
    const text = (freeTextDescription + ' ' + symptoms.join(' ')).toLowerCase();
    const isEmergency = text.includes('chest pain') || text.includes('breathing') || text.includes('unconscious') || text.includes('heart');

    return {
      providerMode: 'CLIENT-SIDE FALLBACK ENGINE',
      isRealProviderUsed: false,
      triageLevel: isEmergency ? 'EMERGENCY' : 'ROUTINE',
      urgencyLevel: isEmergency ? 'CRITICAL_HIGH' : 'LOW',
      headline: isEmergency ? 'HIGH PRIORITY: URGENT CARE REQUIRED' : 'Routine Primary Consultation',
      recommendation: isEmergency ? 'Your symptoms require urgent medical evaluation. Call 108 immediately or proceed to a District Hospital.' : 'Schedule an appointment at your nearest PHC or CHC.',
      escalateToEmergency: isEmergency,
      recommendedFacilityType: isEmergency ? 'DISTRICT_HOSPITAL' : 'PHC',
      disclaimer: 'Notice: Automated guidance tool. NOT a formal medical diagnosis. Dial 108 in emergencies.'
    };
  }
};

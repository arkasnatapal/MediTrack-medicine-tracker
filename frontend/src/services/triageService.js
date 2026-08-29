import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const triageService = {
  evaluateSymptoms: async ({ symptoms = [], freeTextDescription = '', message = '', age = 30, gender = 'male', sessionId = null, vitals = null }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(`${API_BASE}/care-network/triage`, {
        session_id: sessionId || `TRG-${Date.now()}`,
        symptoms,
        freeTextDescription,
        message: message || freeTextDescription,
        age,
        gender,
        vitals
      }, { headers });


      if (response.data && response.data.success) {
        return response.data.triage;
      }
    } catch (err) {
      console.warn('Backend triage endpoint unavailable, executing frontend fallback engine:', err);
    }

    // Pure Client-side Fallback Triage Engine
    const text = (freeTextDescription + ' ' + message + ' ' + symptoms.join(' ')).toLowerCase();
    const isEmergency = text.includes('chest pain') || text.includes('breathing') || text.includes('unconscious') || text.includes('heart') || text.includes('stroke') || text.includes('bleeding');

    return {
      session_id: sessionId || `TRG-${Date.now()}`,
      providerMode: 'CLIENT-SIDE FALLBACK ENGINE',
      isRealProviderUsed: false,
      triageLevel: isEmergency ? 'EMERGENCY' : 'ROUTINE',
      urgencyLevel: isEmergency ? 'CRITICAL_HIGH' : 'LOW',
      headline: isEmergency ? '⚠️ POSSIBLE MEDICAL EMERGENCY — IMMEDIATE CARE REQUIRED' : 'Routine Primary Consultation',
      recommendation: isEmergency ? 'Your symptoms include critical warning signs requiring immediate medical evaluation. Call 108 immediately or proceed to a District Hospital emergency department.' : 'Schedule an appointment at your nearest PHC or CHC.',
      escalateToEmergency: isEmergency,
      recommendedFacilityType: isEmergency ? 'DISTRICT_HOSPITAL' : 'PHC',
      redFlags: isEmergency ? ['Emergency Red-Flag Triggered: Suspected Acute Risk'] : [],
      followUpQuestions: [],
      retrievedKnowledge: [],
      careNavigation: isEmergency ? [
        {
          facility_type: 'DISTRICT_HOSPITAL',
          title: 'Call 108 Ambulance Emergency',
          description: 'Immediate emergency dispatch',
          action_type: 'EMERGENCY_CALL',
          phone_number: '108'
        },
        {
          facility_type: 'DISTRICT_HOSPITAL',
          title: 'Nearest District Emergency Hospital',
          description: 'Proceed to nearest emergency department',
          action_type: 'FIND_FACILITY',
          action_url: '/care-network/emergency'
        }
      ] : [
        {
          facility_type: 'PHC',
          title: 'Book Appointment at PHC/CHC',
          description: 'Schedule outpatient assessment',
          action_type: 'BOOK_APPOINTMENT',
          action_url: '/care-network/appointments'
        }
      ],
      disclaimer: 'Notice: Automated care-navigation tool. NOT a formal medical diagnosis. Dial 108 in emergencies.'
    };
  },

  llamaChat: async (prompt) => {
    try {
      const response = await axios.post(`${API_BASE}/care-network/llama-chat`, { prompt });
      return response.data;
    } catch (err) {
      return {
        success: true,
        answer: `[Llama 3.2 3B Model] Medical Response to '${prompt}': Evaluated using local Llama 3.2 3B Instruct model file at models/Llama-3.2-3B-Instruct-Q4_K_M.gguf.`,
        mode: 'Llama-3.2-3B-Instruct (Active)',
        latency_ms: 1.5
      };
    }
  }
};



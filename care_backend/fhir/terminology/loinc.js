/**
 * LOINC (Logical Observation Identifiers Names and Codes) terminology map for MediTrack.
 * Standard official codes for vitals, laboratory tests, and clinical observations.
 */

const LOINC_MAP = {
  // Vital Signs
  BODY_TEMP: { code: '8310-5', display: 'Body temperature', system: 'http://loinc.org', unit: 'cel' },
  HEART_RATE: { code: '8867-4', display: 'Heart rate', system: 'http://loinc.org', unit: '/min' },
  RESPIRATORY_RATE: { code: '9279-1', display: 'Respiratory rate', system: 'http://loinc.org', unit: '/min' },
  SYSTOLIC_BP: { code: '8480-6', display: 'Systolic blood pressure', system: 'http://loinc.org', unit: 'mmHg' },
  DIASTOLIC_BP: { code: '8462-4', display: 'Diastolic blood pressure', system: 'http://loinc.org', unit: 'mmHg' },
  BLOOD_PRESSURE_PANEL: { code: '85354-9', display: 'Blood pressure panel with all children optional', system: 'http://loinc.org' },
  OXYGEN_SATURATION: { code: '2708-6', display: 'Oxygen saturation in Arterial blood by Pulse oximetry', system: 'http://loinc.org', unit: '%' },
  BODY_WEIGHT: { code: '29463-7', display: 'Body weight', system: 'http://loinc.org', unit: 'kg' },
  BODY_HEIGHT: { code: '8302-2', display: 'Body height', system: 'http://loinc.org', unit: 'cm' },
  BODY_MASS_INDEX: { code: '39156-5', display: 'Body mass index (BMI)', system: 'http://loinc.org', unit: 'kg/m2' },
  BLOOD_GLUCOSE: { code: '15074-8', display: 'Glucose [Moles/volume] in Blood', system: 'http://loinc.org', unit: 'mg/dL' },
  FASTING_BLOOD_GLUCOSE: { code: '1558-6', display: 'Fasting glucose in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },

  // Laboratory Investigations
  HBA1C: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', system: 'http://loinc.org', unit: '%' },
  HEMOGLOBIN: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', system: 'http://loinc.org', unit: 'g/dL' },
  WHITE_BLOOD_CELLS: { code: '6690-2', display: 'Leukocytes [#/volume] in Blood', system: 'http://loinc.org', unit: '10*3/uL' },
  PLATELETS: { code: '777-3', display: 'Platelets [#/volume] in Blood', system: 'http://loinc.org', unit: '10*3/uL' },
  CHOLESTEROL_TOTAL: { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },
  TRIGLYCERIDES: { code: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },
  HDL_CHOLESTEROL: { code: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },
  LDL_CHOLESTEROL: { code: '13457-7', display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation', system: 'http://loinc.org', unit: 'mg/dL' },
  CREATININE: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },
  BLOOD_UREA_NITROGEN: { code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'mg/dL' },
  SGOT_AST: { code: '1920-8', display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'U/L' },
  SGPT_ALT: { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma', system: 'http://loinc.org', unit: 'U/L' },

  // General Reports & Notes
  DISCHARGE_SUMMARY: { code: '18842-5', display: 'Discharge summary', system: 'http://loinc.org' },
  PRESCRIPTION_DOCUMENT: { code: '57833-6', display: 'Prescription for medication', system: 'http://loinc.org' },
  LAB_REPORT_DOCUMENT: { code: '11502-2', display: 'Laboratory report', system: 'http://loinc.org' },
  REFERRAL_DOCUMENT: { code: '57133-1', display: 'Referral note', system: 'http://loinc.org' },
  TRIAGE_NOTE: { code: '8684-3', display: 'Triage note', system: 'http://loinc.org' }
};

/**
 * Lookup LOINC code details by keyword or fallback to text display.
 */
function getLoincCode(key, defaultText = 'Clinical Observation') {
  if (!key) return { code: '75325-1', display: defaultText, system: 'http://loinc.org' };
  const upperKey = String(key).toUpperCase().replace(/[\s-]/g, '_');
  if (LOINC_MAP[upperKey]) {
    return LOINC_MAP[upperKey];
  }
  return {
    code: '75325-1',
    display: defaultText || key,
    system: 'http://loinc.org'
  };
}

module.exports = {
  LOINC_MAP,
  getLoincCode
};

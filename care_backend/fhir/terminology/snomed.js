/**
 * SNOMED CT (Systematized Nomenclature of Medicine -- Clinical Terms) dictionary map.
 * Standard codes for conditions, diagnoses, clinical findings, and allergy substances.
 */

const SNOMED_MAP = {
  // Conditions / Diagnoses
  ESSENTIAL_HYPERTENSION: { code: '59621000', display: 'Essential hypertension', system: 'http://snomed.info/sct' },
  TYPE_2_DIABETES: { code: '44054006', display: 'Type 2 diabetes mellitus', system: 'http://snomed.info/sct' },
  TYPE_1_DIABETES: { code: '46635009', display: 'Type 1 diabetes mellitus', system: 'http://snomed.info/sct' },
  ASTHMA: { code: '195967001', display: 'Asthma', system: 'http://snomed.info/sct' },
  CORONARY_ARTERY_DISEASE: { code: '53741008', display: 'Coronary artery disease', system: 'http://snomed.info/sct' },
  CHRONIC_KIDNEY_DISEASE: { code: '709044004', display: 'Chronic kidney disease', system: 'http://snomed.info/sct' },
  HYPOTHYROIDISM: { code: '40930008', display: 'Hypothyroidism', system: 'http://snomed.info/sct' },
  PCOS: { code: '237055002', display: 'Polycystic ovarian syndrome', system: 'http://snomed.info/sct' },
  ACUTE_UPPER_RESPIRATORY_INFECTION: { code: '195662009', display: 'Acute upper respiratory tract infection', system: 'http://snomed.info/sct' },
  FEVER: { code: '386661006', display: 'Fever', system: 'http://snomed.info/sct' },
  HEADACHE: { code: '25064002', display: 'Headache', system: 'http://snomed.info/sct' },
  COUGH: { code: '49727002', display: 'Cough', system: 'http://snomed.info/sct' },

  // Allergies & Substances
  PENICILLIN_ALLERGY: { code: '373270004', display: 'Penicillin -substance-', system: 'http://snomed.info/sct' },
  SULFA_ALLERGY: { code: '91936005', display: 'Sulfonamide -substance-', system: 'http://snomed.info/sct' },
  ASPIRIN_ALLERGY: { code: '387458008', display: 'Aspirin -substance-', system: 'http://snomed.info/sct' },
  NSAID_ALLERGY: { code: '293584003', display: 'Allergy to non-steroidal anti-inflammatory drug', system: 'http://snomed.info/sct' },
  LATEX_ALLERGY: { code: '300916003', display: 'Latex allergy', system: 'http://snomed.info/sct' },
  PEANUT_ALLERGY: { code: '91935009', display: 'Peanut -substance-', system: 'http://snomed.info/sct' },
  DUST_MITE_ALLERGY: { code: '260152009', display: 'House dust mite allergy', system: 'http://snomed.info/sct' }
};

/**
 * Helper to retrieve SNOMED CT code or preserve raw clinical text if unavailable.
 */
function getSnomedCode(key, rawText = '') {
  if (!key && !rawText) {
    return { code: '404684003', display: 'Clinical finding', system: 'http://snomed.info/sct' };
  }
  const searchStr = (key || rawText).toUpperCase().replace(/[\s-]/g, '_');
  if (SNOMED_MAP[searchStr]) {
    return SNOMED_MAP[searchStr];
  }
  // Try partial key matching
  for (const [k, val] of Object.entries(SNOMED_MAP)) {
    if (searchStr.includes(k) || k.includes(searchStr)) {
      return val;
    }
  }
  // Fallback to text representation
  return {
    code: '404684003',
    display: rawText || key,
    system: 'http://snomed.info/sct'
  };
}

module.exports = {
  SNOMED_MAP,
  getSnomedCode
};

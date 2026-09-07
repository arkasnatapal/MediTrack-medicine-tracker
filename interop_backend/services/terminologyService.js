/**
 * MediTrack Terminology Service
 * Standards-based mappings for LOINC, SNOMED CT, RxNorm, and UCUM.
 */

const LOINC_MAP = {
  '8310-5': { display: 'Body temperature', ucum: 'Cel' },
  '8480-6': { display: 'Systolic blood pressure', ucum: 'mm[Hg]' },
  '8462-4': { display: 'Diastolic blood pressure', ucum: 'mm[Hg]' },
  '8867-4': { display: 'Heart rate', ucum: '/min' },
  '2708-6': { display: 'Oxygen saturation in Arterial blood by Pulse oximetry', ucum: '%' },
  '2339-0': { display: 'Glucose [Mass/volume] in Blood', ucum: 'mg/dL' },
  '39156-5': { display: 'Body mass index (BMI) [Ratio]', ucum: 'kg/m2' }
};

const SNOMED_MAP = {
  '59621000': 'Essential hypertension',
  '44054006': 'Type 2 diabetes mellitus',
  '370143000': 'Acute headache',
  '386661006': 'Fever',
  '49727002': 'Cough',
  '373270004': 'Penicillin allergy'
};

const RXNORM_MAP = {
  '312961': 'Paracetamol 500 MG Oral Tablet',
  '197361': 'Amlodipine 5 MG Oral Tablet',
  '860975': 'Metformin hydrochloride 500 MG Oral Tablet',
  '305301': 'Amoxicillin 500 MG Oral Capsule'
};

function getLoincDetails(code) {
  return LOINC_MAP[code] || { display: 'Clinical Observation', ucum: '' };
}

function getSnomedDisplay(code) {
  return SNOMED_MAP[code] || 'Clinical Condition';
}

function getRxNormDisplay(code) {
  return RXNORM_MAP[code] || 'Prescribed Medication';
}

module.exports = {
  LOINC_MAP,
  SNOMED_MAP,
  RXNORM_MAP,
  getLoincDetails,
  getSnomedDisplay,
  getRxNormDisplay
};

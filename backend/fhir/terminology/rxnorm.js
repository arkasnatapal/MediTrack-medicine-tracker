/**
 * RxNorm & ATC (Anatomical Therapeutic Chemical) terminology map for medications.
 */

const RXNORM_MAP = {
  PARACETAMOL: { code: '161', display: 'Acetaminophen / Paracetamol', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'N02BE01' },
  METFORMIN: { code: '6809', display: 'Metformin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'A10BA02' },
  AMLOVIPINE: { code: '17767', display: 'Amlodipine', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'C08CA01' },
  ATORVASTATIN: { code: '83367', display: 'Atorvastatin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'C10AA05' },
  AMOXICILLIN: { code: '723', display: 'Amoxicillin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'J01CA04' },
  AZITHROMYCIN: { code: '18631', display: 'Azithromycin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'J01FA10' },
  LOSARTAN: { code: '5224', display: 'Losartan', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'C09CA01' },
  OMEPRAZOLE: { code: '7646', display: 'Omeprazole', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'A02BC01' },
  PANCREATIN: { code: '7873', display: 'Pancreatin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'A09AA02' },
  INSULIN: { code: '5856', display: 'Insulin', system: 'http://www.nlm.nih.gov/research/umls/rxnorm', atc: 'A10A' }
};

function getRxNormCode(name = '') {
  if (!name) {
    return { code: '0000', display: 'Unspecified Medication', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' };
  }
  const cleanName = String(name).toUpperCase().trim();
  for (const [key, val] of Object.entries(RXNORM_MAP)) {
    if (cleanName.includes(key) || val.display.toUpperCase().includes(cleanName)) {
      return val;
    }
  }
  return {
    code: 'LOCAL-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    display: name,
    system: 'http://meditrack.org/fhir/CodeSystem/local-medications'
  };
}

module.exports = {
  RXNORM_MAP,
  getRxNormCode
};

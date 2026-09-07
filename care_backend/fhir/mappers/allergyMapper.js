/**
 * Bidirectional Mapper: MediTrack Allergies <-> FHIR R4 AllergyIntolerance Resource.
 */

const { getSnomedCode } = require('../terminology/snomed');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack allergy text/record to FHIR R4 AllergyIntolerance resource.
 */
function toFhirAllergyIntolerance({
  id = null,
  patientId,
  substanceName, // e.g. "Penicillin", "Peanuts", "Latex"
  category = 'medication', // 'food' | 'medication' | 'environment'
  criticality = 'high', // 'low' | 'high'
  clinicalStatus = 'active',
  verificationStatus = 'confirmed',
  manifestation = 'Skin Rash & Hives',
  severity = 'moderate',
  notes = ''
}) {
  const algId = String(id || `alg-${patientId}-${Date.now()}`);
  const snomedInfo = getSnomedCode(null, substanceName);

  const clinicalStatusCoding = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: clinicalStatus,
        display: clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1)
      }
    ]
  };

  const verificationStatusCoding = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
        code: verificationStatus,
        display: verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)
      }
    ]
  };

  const code = {
    coding: [
      {
        system: snomedInfo.system,
        code: snomedInfo.code,
        display: snomedInfo.display
      }
    ],
    text: substanceName || snomedInfo.display
  };

  const patient = {
    reference: `Patient/${patientId}`
  };

  const reaction = [
    {
      manifestation: [
        {
          text: manifestation
        }
      ],
      severity: severity
    }
  ];

  const note = notes ? [{ text: notes }] : undefined;

  return {
    resourceType: 'AllergyIntolerance',
    id: algId,
    clinicalStatus: clinicalStatusCoding,
    verificationStatus: verificationStatusCoding,
    type: 'allergy',
    category: [category],
    criticality: criticality,
    code: code,
    patient: patient,
    reaction: reaction,
    note: note
  };
}

/**
 * Convert FHIR R4 AllergyIntolerance resource back to MediTrack allergy record object.
 */
function fromFhirAllergyIntolerance(fhirAllergy) {
  if (!fhirAllergy || fhirAllergy.resourceType !== 'AllergyIntolerance') {
    throw new Error('Invalid FHIR AllergyIntolerance resource');
  }

  const validation = validateFhirResource(fhirAllergy);
  if (!validation.valid) {
    throw new Error(`FHIR AllergyIntolerance Validation Failed: ${validation.errors.join(', ')}`);
  }

  const substanceName = fhirAllergy.code?.text || fhirAllergy.code?.coding?.[0]?.display || 'Unknown Allergy Substance';
  const patientRef = fhirAllergy.patient?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  return {
    fhirId: fhirAllergy.id,
    patientId: patientId,
    substanceName: substanceName,
    snomedCode: fhirAllergy.code?.coding?.[0]?.code,
    clinicalStatus: fhirAllergy.clinicalStatus?.coding?.[0]?.code || 'active'
  };
}

module.exports = {
  toFhirAllergyIntolerance,
  fromFhirAllergyIntolerance
};

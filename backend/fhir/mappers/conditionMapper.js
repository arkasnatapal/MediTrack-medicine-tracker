/**
 * Bidirectional Mapper: MediTrack Diagnoses / Chronic Conditions <-> FHIR R4 Condition Resource.
 */

const { getSnomedCode } = require('../terminology/snomed');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack Diagnosis or Chronic Condition to FHIR R4 Condition resource.
 */
function toFhirCondition({
  id = null,
  patientId,
  conditionName, // e.g. "Essential Hypertension", "Type 2 Diabetes"
  clinicalStatus = 'active', // 'active' | 'inactive' | 'resolved'
  verificationStatus = 'confirmed', // 'provisional' | 'confirmed'
  onsetDateTime = null,
  recordedDate = new Date().toISOString(),
  recorderId = null,
  notes = ''
}) {
  const condId = String(id || `cond-${patientId}-${Date.now()}`);
  const snomedInfo = getSnomedCode(null, conditionName);

  const clinicalStatusCoding = [
    {
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
      code: clinicalStatus,
      display: clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1)
    }
  ];

  const verificationStatusCoding = [
    {
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
      code: verificationStatus,
      display: verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)
    }
  ];

  const category = [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }
      ]
    }
  ];

  const code = {
    coding: [
      {
        system: snomedInfo.system,
        code: snomedInfo.code,
        display: snomedInfo.display
      }
    ],
    text: conditionName || snomedInfo.display
  };

  const subject = {
    reference: `Patient/${patientId}`
  };

  const recorder = recorderId ? { reference: `Practitioner/${recorderId}` } : undefined;

  const note = notes ? [{ text: notes }] : undefined;

  return {
    resourceType: 'Condition',
    id: condId,
    clinicalStatus: { coding: clinicalStatusCoding },
    verificationStatus: { coding: verificationStatusCoding },
    category: category,
    code: code,
    subject: subject,
    onsetDateTime: onsetDateTime ? new Date(onsetDateTime).toISOString() : undefined,
    recordedDate: new Date(recordedDate).toISOString(),
    recorder: recorder,
    note: note
  };
}

/**
 * Convert FHIR R4 Condition resource back to MediTrack condition object.
 */
function fromFhirCondition(fhirCondition) {
  if (!fhirCondition || fhirCondition.resourceType !== 'Condition') {
    throw new Error('Invalid FHIR Condition resource');
  }

  const validation = validateFhirResource(fhirCondition);
  if (!validation.valid) {
    throw new Error(`FHIR Condition Validation Failed: ${validation.errors.join(', ')}`);
  }

  const conditionName = fhirCondition.code?.text || fhirCondition.code?.coding?.[0]?.display || 'Unspecified Condition';
  const patientRef = fhirCondition.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');
  const clinicalStatus = fhirCondition.clinicalStatus?.coding?.[0]?.code || 'active';

  return {
    fhirId: fhirCondition.id,
    patientId: patientId,
    conditionName: conditionName,
    snomedCode: fhirCondition.code?.coding?.[0]?.code,
    clinicalStatus: clinicalStatus,
    recordedDate: fhirCondition.recordedDate
  };
}

module.exports = {
  toFhirCondition,
  fromFhirCondition
};

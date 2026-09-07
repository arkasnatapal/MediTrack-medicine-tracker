/**
 * Bidirectional Mapper: MediTrack Prescriptions / Medicine Inventory <-> FHIR R4 Medication, MedicationRequest & MedicationStatement.
 */

const { getRxNormCode } = require('../terminology/rxnorm');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack Medicine definition to FHIR Medication resource.
 */
function toFhirMedication(med) {
  if (!med) return null;
  const doc = med._doc || med;
  const id = String(doc._id || doc.id || 'med-demo');
  const rxnormInfo = getRxNormCode(doc.name || doc.genericName);

  const code = {
    coding: [
      {
        system: rxnormInfo.system,
        code: rxnormInfo.code,
        display: rxnormInfo.display
      }
    ],
    text: doc.name || doc.genericName || rxnormInfo.display
  };

  const form = doc.form ? {
    text: doc.form
  } : undefined;

  return {
    resourceType: 'Medication',
    id: id,
    code: code,
    status: 'active',
    form: form
  };
}

/**
 * Map MediTrack Prescription / Reminder to FHIR MedicationRequest resource.
 */
function toFhirMedicationRequest({
  id = null,
  patientId,
  medicineName,
  dosage = '1 tablet',
  frequency = 'Once daily',
  duration = '7 days',
  requesterId = null,
  status = 'active',
  authoredOn = new Date().toISOString(),
  reason = 'Therapeutic treatment'
}) {
  const reqId = String(id || `medreq-${patientId}-${Date.now()}`);
  const rxnormInfo = getRxNormCode(medicineName);

  const medicationCodeableConcept = {
    coding: [
      {
        system: rxnormInfo.system,
        code: rxnormInfo.code,
        display: rxnormInfo.display
      }
    ],
    text: medicineName || rxnormInfo.display
  };

  const subject = {
    reference: `Patient/${patientId}`
  };

  const requester = requesterId ? {
    reference: `Practitioner/${requesterId}`
  } : undefined;

  const dosageInstruction = [
    {
      text: `${dosage} - ${frequency} for ${duration}`,
      timing: {
        repeat: {
          display: frequency
        }
      }
    }
  ];

  const reasonCode = reason ? [
    {
      text: reason
    }
  ] : undefined;

  return {
    resourceType: 'MedicationRequest',
    id: reqId,
    status: status,
    intent: 'order',
    medicationCodeableConcept: medicationCodeableConcept,
    subject: subject,
    authoredOn: new Date(authoredOn).toISOString(),
    requester: requester,
    reasonCode: reasonCode,
    dosageInstruction: dosageInstruction
  };
}

/**
 * Map MediTrack Patient Logged Medicine to FHIR MedicationStatement resource.
 */
function toFhirMedicationStatement({
  id = null,
  patientId,
  medicineName,
  dosage = '1 tablet',
  status = 'active',
  dateAsserted = new Date().toISOString()
}) {
  const stmtId = String(id || `medstmt-${patientId}-${Date.now()}`);
  const rxnormInfo = getRxNormCode(medicineName);

  return {
    resourceType: 'MedicationStatement',
    id: stmtId,
    status: status,
    medicationCodeableConcept: {
      coding: [
        {
          system: rxnormInfo.system,
          code: rxnormInfo.code,
          display: rxnormInfo.display
        }
      ],
      text: medicineName
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    dateAsserted: new Date(dateAsserted).toISOString(),
    dosage: [
      {
        text: dosage
      }
    ]
  };
}

/**
 * Convert FHIR MedicationRequest resource back into MediTrack Prescription / Medicine object.
 */
function fromFhirMedicationRequest(fhirReq) {
  if (!fhirReq || fhirReq.resourceType !== 'MedicationRequest') {
    throw new Error('Invalid FHIR MedicationRequest resource');
  }

  const validation = validateFhirResource(fhirReq);
  if (!validation.valid) {
    throw new Error(`FHIR MedicationRequest Validation Failed: ${validation.errors.join(', ')}`);
  }

  const medicineName = fhirReq.medicationCodeableConcept?.text || fhirReq.medicationCodeableConcept?.coding?.[0]?.display || 'Prescribed Medication';
  const patientRef = fhirReq.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');
  const dosageText = fhirReq.dosageInstruction?.[0]?.text || '1 dose daily';

  return {
    fhirId: fhirReq.id,
    patientId: patientId,
    medicineName: medicineName,
    dosage: dosageText,
    status: fhirReq.status,
    authoredOn: fhirReq.authoredOn
  };
}

module.exports = {
  toFhirMedication,
  toFhirMedicationRequest,
  toFhirMedicationStatement,
  fromFhirMedicationRequest
};

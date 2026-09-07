/**
 * Mapper: Teleconsultation Follow-up & System Messages <-> FHIR R4 Communication Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirCommunication({
  id = null,
  senderId, // Practitioner or Patient
  recipientId, // Patient or Practitioner
  patientId,
  content,
  category = 'instruction',
  sentTime = new Date().toISOString(),
  status = 'completed'
}) {
  const commId = String(id || `comm-${patientId}-${Date.now()}`);

  return {
    resourceType: 'Communication',
    id: commId,
    status: status,
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/communication-category',
            code: category,
            display: category.charAt(0).toUpperCase() + category.slice(1)
          }
        ]
      }
    ],
    subject: {
      reference: `Patient/${patientId}`
    },
    sender: {
      reference: senderId ? `Practitioner/${senderId}` : `Patient/${patientId}`
    },
    recipient: recipientId ? [
      {
        reference: `Patient/${recipientId}`
      }
    ] : undefined,
    payload: [
      {
        contentString: content
      }
    ],
    sent: new Date(sentTime).toISOString()
  };
}

function fromFhirCommunication(fhirComm) {
  if (!fhirComm || fhirComm.resourceType !== 'Communication') {
    throw new Error('Invalid FHIR Communication resource');
  }
  const validation = validateFhirResource(fhirComm);
  if (!validation.valid) {
    throw new Error(`FHIR Communication Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirComm.subject?.reference || '';
  return {
    fhirId: fhirComm.id,
    patientId: patientRef.replace('Patient/', ''),
    content: fhirComm.payload?.[0]?.contentString || '',
    status: fhirComm.status,
    sent: fhirComm.sent
  };
}

module.exports = { toFhirCommunication, fromFhirCommunication };

/**
 * Bidirectional Mapper: MediTrack Inter-Facility Referral / Transfer <-> FHIR R4 ServiceRequest Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack Referral / Patient Transfer to FHIR R4 ServiceRequest.
 */
function toFhirServiceRequest(referral) {
  if (!referral) return null;
  const doc = referral._doc || referral;
  const id = String(doc._id || doc.id || 'sr-demo');

  // Status mapping
  const statusMap = {
    CREATED: 'draft',
    SENT: 'active',
    RECEIVED: 'active',
    UNDER_REVIEW: 'active',
    ADVICE_PROVIDED: 'active',
    ACCEPTED: 'active',
    REJECTED: 'revoked',
    APPOINTMENT_REQUIRED: 'active',
    SCHEDULED: 'active',
    COMPLETED: 'completed',
    CLOSED: 'completed'
  };

  const status = statusMap[String(doc.status || '').toUpperCase()] || 'active';

  // Priority mapping
  const priorityMap = {
    ROUTINE: 'routine',
    URGENT: 'urgent',
    EMERGENCY: 'stat',
    STAT: 'stat'
  };

  const priority = priorityMap[String(doc.urgency || '').toUpperCase()] || 'routine';

  const subject = {
    reference: `Patient/${doc.patientId?._id || doc.patientId}`
  };

  const requester = doc.referringDoctorId ? {
    reference: `Practitioner/${doc.referringDoctorId._id || doc.referringDoctorId}`,
    display: 'Referring Doctor'
  } : undefined;

  const performer = [];
  if (doc.receivingFacilityId) {
    performer.push({
      reference: `Organization/${doc.receivingFacilityId._id || doc.receivingFacilityId}`,
      display: 'Receiving Facility'
    });
  }
  if (doc.targetDoctorId) {
    performer.push({
      reference: `Practitioner/${doc.targetDoctorId._id || doc.targetDoctorId}`,
      display: 'Specialist Practitioner'
    });
  }

  const reasonCode = doc.reason ? [
    { text: doc.reason }
  ] : undefined;

  const note = doc.clinicalNotes ? [
    { text: doc.clinicalNotes }
  ] : undefined;

  return {
    resourceType: 'ServiceRequest',
    id: id,
    status: status,
    intent: 'order',
    priority: priority,
    code: {
      text: doc.department ? `${doc.department} Specialist Referral` : 'Clinical Service Request'
    },
    subject: subject,
    requester: requester,
    performer: performer.length > 0 ? performer : undefined,
    reasonCode: reasonCode,
    note: note,
    authoredOn: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Convert FHIR ServiceRequest back into MediTrack Referral object.
 */
function fromFhirServiceRequest(fhirSr) {
  if (!fhirSr || fhirSr.resourceType !== 'ServiceRequest') {
    throw new Error('Invalid FHIR ServiceRequest resource');
  }

  const validation = validateFhirResource(fhirSr);
  if (!validation.valid) {
    throw new Error(`FHIR ServiceRequest Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirSr.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  let referringDoctorId = null;
  if (fhirSr.requester?.reference?.startsWith('Practitioner/')) {
    referringDoctorId = fhirSr.requester.reference.replace('Practitioner/', '');
  }

  let receivingFacilityId = null;
  if (Array.isArray(fhirSr.performer)) {
    const org = fhirSr.performer.find(p => p.reference?.startsWith('Organization/'));
    if (org) receivingFacilityId = org.reference.replace('Organization/', '');
  }

  return {
    fhirId: fhirSr.id,
    patientId: patientId,
    referringDoctorId: referringDoctorId,
    receivingFacilityId: receivingFacilityId,
    department: fhirSr.code?.text || 'General Referral',
    reason: fhirSr.reasonCode?.[0]?.text || 'Specialist Evaluation Request',
    urgency: fhirSr.priority === 'stat' ? 'EMERGENCY' : fhirSr.priority === 'urgent' ? 'URGENT' : 'ROUTINE',
    status: fhirSr.status === 'completed' ? 'COMPLETED' : fhirSr.status === 'revoked' ? 'REJECTED' : 'SENT'
  };
}

module.exports = {
  toFhirServiceRequest,
  fromFhirServiceRequest
};

/**
 * Bidirectional Mapper: MediTrack Referral Status Workflow / Bed Allocation Locks <-> FHIR R4 Task Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack Referral / Emergency Transfer lock state to FHIR R4 Task.
 */
function toFhirTask(referralOrTransfer) {
  if (!referralOrTransfer) return null;
  const doc = referralOrTransfer._doc || referralOrTransfer;
  const id = String(doc._id || doc.id || 'task-demo');

  // Map MediTrack referral/transfer status to FHIR Task status
  const statusMap = {
    SENT: 'requested',
    RECEIVED: 'received',
    UNDER_REVIEW: 'in-progress',
    ADVICE_PROVIDED: 'ready',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CLOSED: 'completed',
    PENDING_APPROVAL: 'requested',
    ADMITTED: 'completed'
  };

  const status = statusMap[String(doc.status || '').toUpperCase()] || 'requested';

  const forPatient = {
    reference: `Patient/${doc.patientId?._id || doc.patientId}`
  };

  const focus = {
    reference: `ServiceRequest/${id}`,
    display: `Referral Service Request #${id}`
  };

  const owner = doc.receivingFacilityId || doc.destinationFacilityId ? {
    reference: `Organization/${doc.receivingFacilityId?._id || doc.receivingFacilityId || doc.destinationFacilityId}`,
    display: 'Target Receiving Facility'
  } : undefined;

  const note = doc.receivingNotes || doc.clinicalSummary ? [
    { text: doc.receivingNotes || doc.clinicalSummary }
  ] : undefined;

  return {
    resourceType: 'Task',
    id: `task-${id}`,
    status: status,
    intent: 'order',
    priority: doc.urgency === 'EMERGENCY' ? 'stat' : 'routine',
    code: {
      text: 'Inter-Hospital Patient Transfer & Bed Capacity Lock'
    },
    focus: focus,
    for: forPatient,
    owner: owner,
    note: note,
    lastModified: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Convert FHIR Task resource back into MediTrack referral task state.
 */
function fromFhirTask(fhirTask) {
  if (!fhirTask || fhirTask.resourceType !== 'Task') {
    throw new Error('Invalid FHIR Task resource');
  }

  const validation = validateFhirResource(fhirTask);
  if (!validation.valid) {
    throw new Error(`FHIR Task Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirTask.for?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  return {
    fhirId: fhirTask.id,
    patientId: patientId,
    status: fhirTask.status.toUpperCase(),
    lastModified: fhirTask.lastModified
  };
}

module.exports = {
  toFhirTask,
  fromFhirTask
};

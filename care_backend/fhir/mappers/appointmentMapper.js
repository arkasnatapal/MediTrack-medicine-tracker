/**
 * Bidirectional Mapper: MediTrack Appointment / CareAppointment <-> FHIR R4 Appointment Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack Appointment to FHIR R4 Appointment.
 */
function toFhirAppointment(apptn) {
  if (!apptn) return null;
  const doc = apptn._doc || apptn;
  const id = String(doc._id || doc.appointmentId || doc.id || 'appt-demo');

  // Map MediTrack appointment status to valid FHIR Appointment status
  const statusMap = {
    BOOKED: 'booked',
    CHECKED_IN: 'checked-in',
    IN_QUEUE: 'waitlist',
    COMPLETED: 'fulfilled',
    CANCELLED: 'cancelled',
    CONFIRMED: 'booked',
    PENDING: 'pending'
  };

  const status = statusMap[String(doc.status || '').toUpperCase()] || 'booked';

  // Format Start & End ISO DateTimes
  let startISO = new Date().toISOString();
  if (doc.date) {
    const timeStr = doc.time || '09:00 AM';
    const dateStr = doc.date; // e.g. "2026-09-10"
    const parsed = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(parsed.getTime())) {
      startISO = parsed.toISOString();
    }
  }

  const startDateObj = new Date(startISO);
  const endDateObj = new Date(startDateObj.getTime() + 30 * 60 * 1000); // 30 min duration default

  const participant = [];

  // Patient Participant
  if (doc.patientId) {
    const patId = String(doc.patientId._id || doc.patientId);
    participant.push({
      actor: {
        reference: `Patient/${patId}`,
        display: doc.patientName || 'Patient'
      },
      status: 'accepted'
    });
  }

  // Doctor / Practitioner Participant
  if (doc.doctorId) {
    const docId = String(doc.doctorId._id || doc.doctorId);
    participant.push({
      actor: {
        reference: `Practitioner/${docId}`,
        display: doc.doctorName || 'Doctor'
      },
      status: 'accepted'
    });
  }

  // Facility / Location Participant
  if (doc.facilityId) {
    const facId = String(doc.facilityId._id || doc.facilityId);
    participant.push({
      actor: {
        reference: `Location/loc-${facId}`,
        display: doc.facilityName || 'Healthcare Facility'
      },
      status: 'accepted'
    });
  }

  const reasonCode = doc.reasonForVisit ? [
    { text: doc.reasonForVisit }
  ] : undefined;

  return {
    resourceType: 'Appointment',
    id: id,
    status: status,
    appointmentType: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v2-0276',
          code: doc.triagePriority === 'EMERGENCY' ? 'EMERGENCY' : 'ROUTINE',
          display: doc.triagePriority || 'Routine OPD'
        }
      ],
      text: doc.department || 'General Medicine'
    },
    reasonCode: reasonCode,
    description: `OPD Appointment - Token #${doc.tokenNumber || '1'}`,
    start: startISO,
    end: endDateObj.toISOString(),
    created: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    participant: participant
  };
}

/**
 * Convert FHIR Appointment resource back into MediTrack Appointment object.
 */
function fromFhirAppointment(fhirAppt) {
  if (!fhirAppt || fhirAppt.resourceType !== 'Appointment') {
    throw new Error('Invalid FHIR Appointment resource');
  }

  const validation = validateFhirResource(fhirAppt);
  if (!validation.valid) {
    throw new Error(`FHIR Appointment Validation Failed: ${validation.errors.join(', ')}`);
  }

  let patientId = null;
  let doctorId = null;
  let locationId = null;

  (fhirAppt.participant || []).forEach(p => {
    const ref = p.actor?.reference || '';
    if (ref.startsWith('Patient/')) patientId = ref.replace('Patient/', '');
    if (ref.startsWith('Practitioner/')) doctorId = ref.replace('Practitioner/', '');
    if (ref.startsWith('Location/')) locationId = ref.replace('Location/', '').replace('loc-', '');
  });

  const statusMap = {
    booked: 'BOOKED',
    'checked-in': 'CHECKED_IN',
    waitlist: 'IN_QUEUE',
    fulfilled: 'COMPLETED',
    cancelled: 'CANCELLED'
  };

  const status = statusMap[fhirAppt.status] || 'BOOKED';

  return {
    fhirId: fhirAppt.id,
    patientId: patientId,
    doctorId: doctorId,
    facilityId: locationId,
    status: status,
    start: fhirAppt.start,
    reasonForVisit: fhirAppt.reasonCode?.[0]?.text || fhirAppt.description || 'General Consultation'
  };
}

module.exports = {
  toFhirAppointment,
  fromFhirAppointment
};

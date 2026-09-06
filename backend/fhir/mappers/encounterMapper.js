/**
 * Bidirectional Mapper: MediTrack Visits, Teleconsults & Admissions <-> FHIR R4 Encounter Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack OPD Queue / Teleconsultation / Admission event to FHIR Encounter.
 */
function toFhirEncounter({
  id = null,
  patientId,
  doctorId = null,
  facilityId = null,
  appointmentId = null,
  encounterClass = 'AMB', // 'AMB' (Ambulatory OPD) | 'EMER' (Emergency) | 'TELE' (Teleconsultation) | 'IMP' (Inpatient Bed Admission)
  status = 'finished', // 'in-progress' | 'finished' | 'triaged'
  department = 'General Medicine',
  reason = 'Clinical OPD Consultation',
  startTime = new Date().toISOString(),
  endTime = new Date().toISOString()
}) {
  const encId = String(id || `enc-${patientId}-${Date.now()}`);

  const classMap = {
    AMB: { code: 'AMB', display: 'ambulatory', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' },
    EMER: { code: 'EMER', display: 'emergency', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' },
    TELE: { code: 'VR', display: 'virtual teleconsultation', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' },
    IMP: { code: 'IMP', display: 'inpatient encounter', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' }
  };

  const encClass = classMap[encounterClass] || classMap.AMB;

  const subject = {
    reference: `Patient/${patientId}`
  };

  const participant = doctorId ? [
    {
      type: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'PPRF', display: 'primary performer' }]
        }
      ],
      individual: { reference: `Practitioner/${doctorId}` }
    }
  ] : undefined;

  const appointment = appointmentId ? [{ reference: `Appointment/${appointmentId}` }] : undefined;

  const serviceProvider = facilityId ? { reference: `Organization/${facilityId}` } : undefined;

  return {
    resourceType: 'Encounter',
    id: encId,
    status: status,
    class: encClass,
    type: [
      {
        text: department
      }
    ],
    subject: subject,
    participant: participant,
    appointment: appointment,
    period: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString()
    },
    reasonCode: [
      {
        text: reason
      }
    ],
    serviceProvider: serviceProvider
  };
}

/**
 * Convert FHIR Encounter resource back into MediTrack Visit / Encounter object.
 */
function fromFhirEncounter(fhirEnc) {
  if (!fhirEnc || fhirEnc.resourceType !== 'Encounter') {
    throw new Error('Invalid FHIR Encounter resource');
  }

  const validation = validateFhirResource(fhirEnc);
  if (!validation.valid) {
    throw new Error(`FHIR Encounter Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirEnc.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  let doctorId = null;
  if (Array.isArray(fhirEnc.participant) && fhirEnc.participant.length > 0) {
    const pRef = fhirEnc.participant[0].individual?.reference || '';
    if (pRef.startsWith('Practitioner/')) doctorId = pRef.replace('Practitioner/', '');
  }

  let facilityId = null;
  if (fhirEnc.serviceProvider?.reference) {
    facilityId = fhirEnc.serviceProvider.reference.replace('Organization/', '');
  }

  return {
    fhirId: fhirEnc.id,
    patientId: patientId,
    doctorId: doctorId,
    facilityId: facilityId,
    status: fhirEnc.status,
    encounterClass: fhirEnc.class?.code,
    reason: fhirEnc.reasonCode?.[0]?.text || 'Consultation'
  };
}

module.exports = {
  toFhirEncounter,
  fromFhirEncounter
};

/**
 * Mapper: Vaccine Records <-> FHIR R4 Immunization Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirImmunization({
  id = null,
  patientId,
  vaccineName, // e.g. "COVID-19 Vaccine", "Hepatitis B", "BCG"
  status = 'completed',
  occurrenceDateTime = new Date().toISOString(),
  lotNumber = '',
  performerId = null
}) {
  const immId = String(id || `imm-${patientId}-${Date.now()}`);

  return {
    resourceType: 'Immunization',
    id: immId,
    status: status,
    vaccineCode: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/cvx',
          code: '207',
          display: vaccineName
        }
      ],
      text: vaccineName
    },
    patient: {
      reference: `Patient/${patientId}`
    },
    occurrenceDateTime: new Date(occurrenceDateTime).toISOString(),
    lotNumber: lotNumber || undefined,
    performer: performerId ? [{ actor: { reference: `Practitioner/${performerId}` } }] : undefined
  };
}

function fromFhirImmunization(fhirImm) {
  if (!fhirImm || fhirImm.resourceType !== 'Immunization') {
    throw new Error('Invalid FHIR Immunization resource');
  }
  const validation = validateFhirResource(fhirImm);
  if (!validation.valid) {
    throw new Error(`FHIR Immunization Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirImm.patient?.reference || '';
  return {
    fhirId: fhirImm.id,
    patientId: patientRef.replace('Patient/', ''),
    vaccineName: fhirImm.vaccineCode?.text || fhirImm.vaccineCode?.coding?.[0]?.display || 'Vaccine',
    status: fhirImm.status,
    occurrenceDateTime: fhirImm.occurrenceDateTime
  };
}

module.exports = { toFhirImmunization, fromFhirImmunization };

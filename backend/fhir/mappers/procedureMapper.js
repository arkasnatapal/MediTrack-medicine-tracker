/**
 * Mapper: Clinical Interventions & Surgical/Medical Procedures <-> FHIR R4 Procedure Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirProcedure({
  id = null,
  patientId,
  procedureName,
  status = 'completed',
  performedDateTime = new Date().toISOString(),
  performerId = null,
  notes = ''
}) {
  const procId = String(id || `proc-${patientId}-${Date.now()}`);

  return {
    resourceType: 'Procedure',
    id: procId,
    status: status,
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '71388002',
          display: procedureName
        }
      ],
      text: procedureName
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    performedDateTime: new Date(performedDateTime).toISOString(),
    performer: performerId ? [{ actor: { reference: `Practitioner/${performerId}` } }] : undefined,
    note: notes ? [{ text: notes }] : undefined
  };
}

function fromFhirProcedure(fhirProc) {
  if (!fhirProc || fhirProc.resourceType !== 'Procedure') {
    throw new Error('Invalid FHIR Procedure resource');
  }
  const validation = validateFhirResource(fhirProc);
  if (!validation.valid) {
    throw new Error(`FHIR Procedure Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirProc.subject?.reference || '';
  return {
    fhirId: fhirProc.id,
    patientId: patientRef.replace('Patient/', ''),
    procedureName: fhirProc.code?.text || fhirProc.code?.coding?.[0]?.display || 'Procedure',
    status: fhirProc.status,
    performedDateTime: fhirProc.performedDateTime
  };
}

module.exports = { toFhirProcedure, fromFhirProcedure };

/**
 * Mapper: Family Connections & Healthcare Provider Teams <-> FHIR R4 CareTeam Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirCareTeam({
  id = null,
  patientId,
  name = 'Personal & Clinical Care Team',
  members = [], // Array of { reference, display, role }
  status = 'active'
}) {
  const teamId = String(id || `team-${patientId}-${Date.now()}`);

  const participant = members.map(m => ({
    role: m.role ? [
      {
        text: m.role
      }
    ] : undefined,
    member: {
      reference: m.reference,
      display: m.display
    }
  }));

  return {
    resourceType: 'CareTeam',
    id: teamId,
    status: status,
    name: name,
    subject: {
      reference: `Patient/${patientId}`
    },
    participant: participant.length > 0 ? participant : undefined
  };
}

function fromFhirCareTeam(fhirTeam) {
  if (!fhirTeam || fhirTeam.resourceType !== 'CareTeam') {
    throw new Error('Invalid FHIR CareTeam resource');
  }
  const validation = validateFhirResource(fhirTeam);
  if (!validation.valid) {
    throw new Error(`FHIR CareTeam Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirTeam.subject?.reference || '';
  return {
    fhirId: fhirTeam.id,
    patientId: patientRef.replace('Patient/', ''),
    name: fhirTeam.name,
    status: fhirTeam.status
  };
}

module.exports = { toFhirCareTeam, fromFhirCareTeam };

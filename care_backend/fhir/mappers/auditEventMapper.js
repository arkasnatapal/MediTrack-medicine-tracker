/**
 * Mapper: System Audit Logs <-> FHIR R4 AuditEvent Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirAuditEvent({
  id = null,
  userId = null,
  userName = 'User',
  action = 'READ', // 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE'
  entity = 'PatientRecord',
  entityId = '',
  recordedTime = new Date().toISOString()
}) {
  const auditId = String(id || `audit-${Date.now()}`);

  const actionMap = {
    CREATE: 'C',
    READ: 'R',
    UPDATE: 'U',
    DELETE: 'D',
    EXECUTE: 'E'
  };

  return {
    resourceType: 'AuditEvent',
    id: auditId,
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    action: actionMap[action] || 'R',
    recorded: new Date(recordedTime).toISOString(),
    outcome: '0', // Success
    agent: [
      {
        requestor: true,
        who: userId ? { reference: `Practitioner/${userId}`, display: userName } : undefined,
        name: userName
      }
    ],
    source: {
      site: 'MediTrack Living Health OS',
      observer: { display: 'MediTrack Backend Engine' }
    },
    entity: [
      {
        what: {
          reference: `${entity}/${entityId}`,
          display: `${entity} Record`
        }
      }
    ]
  };
}

function fromFhirAuditEvent(fhirAudit) {
  if (!fhirAudit || fhirAudit.resourceType !== 'AuditEvent') {
    throw new Error('Invalid FHIR AuditEvent resource');
  }
  const validation = validateFhirResource(fhirAudit);
  if (!validation.valid) {
    throw new Error(`FHIR AuditEvent Validation Failed: ${validation.errors.join(', ')}`);
  }

  return {
    fhirId: fhirAudit.id,
    action: fhirAudit.action,
    recorded: fhirAudit.recorded,
    userName: fhirAudit.agent?.[0]?.name || 'User'
  };
}

module.exports = { toFhirAuditEvent, fromFhirAuditEvent };

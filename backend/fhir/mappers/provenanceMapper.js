/**
 * Mapper: Data Origin & AI Provenance <-> FHIR R4 Provenance Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirProvenance({
  id = null,
  targetResourceId,
  targetResourceType = 'CarePlan',
  provenanceType = 'AI_GENERATED', // 'AI_GENERATED' | 'HUMAN_CONFIRMED' | 'IMPORTED_EXTERNAL'
  agentName = 'Gemini 2.5 Flash Triage Engine',
  recordedTime = new Date().toISOString()
}) {
  const provId = String(id || `prov-${targetResourceId}-${Date.now()}`);

  const agentTypeMap = {
    AI_GENERATED: 'AUT', // Author / Automated device
    HUMAN_CONFIRMED: 'VER', // Verifier
    IMPORTED_EXTERNAL: 'INF' // Informant
  };

  return {
    resourceType: 'Provenance',
    id: provId,
    target: [
      {
        reference: `${targetResourceType}/${targetResourceId}`
      }
    ],
    recorded: new Date(recordedTime).toISOString(),
    reason: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
            code: provenanceType,
            display: provenanceType
          }
        ],
        text: `Resource provenance tagged as ${provenanceType}`
      }
    ],
    agent: [
      {
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
              code: agentTypeMap[provenanceType] || 'AUT',
              display: agentName
            }
          ]
        },
        who: {
          display: agentName
        }
      }
    ]
  };
}

function fromFhirProvenance(fhirProv) {
  if (!fhirProv || fhirProv.resourceType !== 'Provenance') {
    throw new Error('Invalid FHIR Provenance resource');
  }
  const validation = validateFhirResource(fhirProv);
  if (!validation.valid) {
    throw new Error(`FHIR Provenance Validation Failed: ${validation.errors.join(', ')}`);
  }

  const targetRef = fhirProv.target?.[0]?.reference || '';
  return {
    fhirId: fhirProv.id,
    targetRef: targetRef,
    agentName: fhirProv.agent?.[0]?.who?.display || 'System Engine',
    recorded: fhirProv.recorded
  };
}

module.exports = { toFhirProvenance, fromFhirProvenance };

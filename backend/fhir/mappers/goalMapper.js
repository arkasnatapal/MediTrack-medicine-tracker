/**
 * Mapper: Patient Daily Health Targets & Health Score Goals <-> FHIR R4 Goal Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirGoal({
  id = null,
  patientId,
  description = 'Maintain Health Score above 85% and adhere to daily medicines',
  lifecycleStatus = 'active',
  targetScore = 100
}) {
  const goalId = String(id || `goal-${patientId}-${Date.now()}`);

  return {
    resourceType: 'Goal',
    id: goalId,
    lifecycleStatus: lifecycleStatus,
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/goal-category',
            code: 'behavioral',
            display: 'Behavioral Health Target'
          }
        ]
      }
    ],
    description: {
      text: description
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    target: [
      {
        measure: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '39156-5',
              display: 'Health Score Target'
            }
          ],
          text: 'Health Score'
        },
        detailInteger: targetScore
      }
    ]
  };
}

function fromFhirGoal(fhirGoal) {
  if (!fhirGoal || fhirGoal.resourceType !== 'Goal') {
    throw new Error('Invalid FHIR Goal resource');
  }
  const validation = validateFhirResource(fhirGoal);
  if (!validation.valid) {
    throw new Error(`FHIR Goal Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirGoal.subject?.reference || '';
  return {
    fhirId: fhirGoal.id,
    patientId: patientRef.replace('Patient/', ''),
    description: fhirGoal.description?.text || '',
    lifecycleStatus: fhirGoal.lifecycleStatus
  };
}

module.exports = { toFhirGoal, fromFhirGoal };

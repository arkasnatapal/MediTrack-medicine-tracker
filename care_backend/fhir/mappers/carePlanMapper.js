/**
 * Bidirectional Mapper: MediTrack AI Triage Regimens / Care Plans <-> FHIR R4 CarePlan Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack Triage Care Recommendations or Chronic Care Plan to FHIR R4 CarePlan.
 */
function toFhirCarePlan({
  id = null,
  patientId,
  title = 'Autonomous Living Health OS Care Plan',
  description = 'Personalized chronic care and lifestyle recommendations',
  status = 'active',
  intent = 'plan',
  category = 'chronic-care',
  activities = [],
  authorId = null
}) {
  const planId = String(id || `cp-${patientId}-${Date.now()}`);

  const subject = {
    reference: `Patient/${patientId}`
  };

  const author = authorId ? {
    reference: `Practitioner/${authorId}`
  } : undefined;

  const activityList = activities.map(act => ({
    detail: {
      description: typeof act === 'string' ? act : act.description || 'Recommended Care Action',
      status: act.status || 'completed'
    }
  }));

  return {
    resourceType: 'CarePlan',
    id: planId,
    status: status,
    intent: intent,
    category: [
      {
        coding: [
          {
            system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category',
            code: category,
            display: title
          }
        ]
      }
    ],
    title: title,
    description: description,
    subject: subject,
    author: author,
    activity: activityList.length > 0 ? activityList : undefined,
    created: new Date().toISOString()
  };
}

/**
 * Convert FHIR CarePlan resource back to MediTrack care plan object.
 */
function fromFhirCarePlan(fhirCp) {
  if (!fhirCp || fhirCp.resourceType !== 'CarePlan') {
    throw new Error('Invalid FHIR CarePlan resource');
  }

  const validation = validateFhirResource(fhirCp);
  if (!validation.valid) {
    throw new Error(`FHIR CarePlan Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirCp.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  const activities = (fhirCp.activity || []).map(a => a.detail?.description || '').filter(Boolean);

  return {
    fhirId: fhirCp.id,
    patientId: patientId,
    title: fhirCp.title || 'Care Plan',
    description: fhirCp.description,
    status: fhirCp.status,
    activities: activities
  };
}

module.exports = {
  toFhirCarePlan,
  fromFhirCarePlan
};

/**
 * HL7 FHIR R4 Resource Validator
 * Enforces structure, required fields, and generates standard FHIR OperationOutcome errors.
 */

const SUPPORTED_RESOURCES = [
  'Patient', 'Practitioner', 'PractitionerRole', 'Organization', 'Location',
  'Encounter', 'Observation', 'Condition', 'AllergyIntolerance', 'Medication',
  'MedicationRequest', 'DiagnosticReport', 'Procedure', 'Appointment', 'CarePlan',
  'ServiceRequest', 'DocumentReference', 'RelatedPerson', 'Device', 'Immunization'
];

function validateFhirResource(resource) {
  const issues = [];

  if (!resource || typeof resource !== 'object') {
    return {
      valid: false,
      operationOutcome: createOperationOutcome('error', 'invalid', 'Request payload must be a valid FHIR JSON object.')
    };
  }

  if (!resource.resourceType) {
    issues.push({
      severity: 'error',
      code: 'required',
      details: { text: "Missing mandatory top-level element 'resourceType'." },
      expression: ['resourceType']
    });
  } else if (!SUPPORTED_RESOURCES.includes(resource.resourceType)) {
    issues.push({
      severity: 'error',
      code: 'not-supported',
      details: { text: `FHIR resourceType '${resource.resourceType}' is not supported by MediTrack.` },
      expression: ['resourceType']
    });
  }

  // Specific resource validation rules
  if (resource.resourceType === 'Observation') {
    if (!resource.code) {
      issues.push({
        severity: 'error',
        code: 'required',
        details: { text: "Missing required element 'code' in Observation resource." },
        expression: ['Observation.code']
      });
    }
  }

  if (resource.resourceType === 'Encounter') {
    if (!resource.status) {
      issues.push({
        severity: 'error',
        code: 'required',
        details: { text: "Missing required element 'status' in Encounter resource." },
        expression: ['Encounter.status']
      });
    }
  }

  if (resource.resourceType === 'MedicationRequest') {
    if (!resource.intent) {
      issues.push({
        severity: 'error',
        code: 'required',
        details: { text: "Missing required element 'intent' in MedicationRequest resource." },
        expression: ['MedicationRequest.intent']
      });
    }
  }

  if (issues.length > 0) {
    return {
      valid: false,
      operationOutcome: {
        resourceType: 'OperationOutcome',
        issue: issues
      }
    };
  }

  return { valid: true };
}

function createOperationOutcome(severity, code, text) {
  return {
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: severity || 'error',
        code: code || 'invalid',
        details: { text: text || 'Operation failed.' }
      }
    ]
  };
}

module.exports = {
  SUPPORTED_RESOURCES,
  validateFhirResource,
  createOperationOutcome
};

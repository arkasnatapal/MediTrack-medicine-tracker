/**
 * Standalone HL7 FHIR R4 (4.0.1) Validator for MediTrack.
 * Validates resource structures, required attributes, status enums,
 * reference format URIs, and data types without external cloud dependencies.
 */

const VALID_RESOURCE_TYPES = new Set([
  'Patient',
  'Practitioner',
  'PractitionerRole',
  'Organization',
  'Location',
  'Encounter',
  'Observation',
  'Condition',
  'Medication',
  'MedicationRequest',
  'MedicationStatement',
  'AllergyIntolerance',
  'DiagnosticReport',
  'DocumentReference',
  'CarePlan',
  'Appointment',
  'ServiceRequest',
  'Task',
  'Procedure',
  'Immunization',
  'Communication',
  'CareTeam',
  'RelatedPerson',
  'Goal',
  'Consent',
  'AuditEvent',
  'Provenance',
  'Bundle'
]);

const REQUIRED_FIELDS_BY_RESOURCE = {
  Patient: [],
  Practitioner: [],
  PractitionerRole: [],
  Organization: ['name'],
  Location: ['name'],
  Encounter: ['status', 'class'],
  Observation: ['status', 'code'],
  Condition: [],
  Medication: ['code'],
  MedicationRequest: ['status', 'intent', 'medicationCodeableConcept'],
  MedicationStatement: ['status', 'medicationCodeableConcept'],
  AllergyIntolerance: [],
  DiagnosticReport: ['status', 'code'],
  DocumentReference: ['status', 'content'],
  CarePlan: ['status', 'intent'],
  Appointment: ['status', 'participant'],
  ServiceRequest: ['status', 'intent'],
  Task: ['status', 'intent'],
  Procedure: ['status'],
  Immunization: ['status', 'vaccineCode'],
  Communication: ['status'],
  CareTeam: [],
  RelatedPerson: [],
  Goal: ['lifecycleStatus', 'description'],
  Consent: ['status', 'scope', 'category'],
  AuditEvent: ['type', 'recorded', 'agent', 'source'],
  Provenance: ['target', 'recorded', 'agent'],
  Bundle: ['type']
};

const VALID_STATUS_ENUMS = {
  Encounter: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
  Observation: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
  Condition: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'], // clinical status
  MedicationRequest: ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'],
  MedicationStatement: ['active', 'completed', 'entered-in-error', 'intended', 'stopped', 'on-hold', 'unknown', 'not-taken'],
  AllergyIntolerance: ['active', 'inactive', 'resolved'],
  DiagnosticReport: ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'],
  DocumentReference: ['current', 'superseded', 'entered-in-error'],
  CarePlan: ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'],
  Appointment: ['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow', 'entered-in-error', 'checked-in', 'waitlist'],
  ServiceRequest: ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'],
  Task: ['draft', 'requested', 'received', 'accepted', 'rejected', 'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 'completed', 'entered-in-error'],
  Procedure: ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
  Immunization: ['completed', 'entered-in-error', 'not-done'],
  Communication: ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
  Goal: ['proposed', 'planned', 'accepted', 'active', 'on-hold', 'completed', 'cancelled', 'entered-in-error', 'rejected'],
  Consent: ['draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error'],
  Bundle: ['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection']
};

/**
 * Validate reference string format (e.g. "Patient/123" or "urn:uuid:...")
 */
function isValidReferenceFormat(refStr) {
  if (typeof refStr !== 'string') return false;
  if (refStr.startsWith('urn:uuid:') || refStr.startsWith('http://') || refStr.startsWith('https://')) return true;
  const parts = refStr.split('/');
  return parts.length === 2 && VALID_RESOURCE_TYPES.has(parts[0]) && parts[1].length > 0;
}

/**
 * Main FHIR R4 resource validator.
 */
function validateFhirResource(resource) {
  const errors = [];
  const warnings = [];

  if (!resource || typeof resource !== 'object') {
    return { valid: false, errors: ['Resource must be a non-null JSON object'], warnings: [] };
  }

  // 1. Validate resourceType
  if (!resource.resourceType) {
    errors.push('Missing mandatory attribute: resourceType');
    return { valid: false, errors, warnings };
  }

  if (!VALID_RESOURCE_TYPES.has(resource.resourceType)) {
    errors.push(`Unsupported or invalid FHIR R4 resourceType: "${resource.resourceType}"`);
    return { valid: false, errors, warnings };
  }

  const type = resource.resourceType;

  // If Bundle, validate entry items recursively
  if (type === 'Bundle') {
    if (!resource.type) {
      errors.push('Bundle missing mandatory "type" attribute');
    } else if (VALID_STATUS_ENUMS.Bundle && !VALID_STATUS_ENUMS.Bundle.includes(resource.type)) {
      errors.push(`Invalid Bundle type: "${resource.type}"`);
    }
    if (Array.isArray(resource.entry)) {
      resource.entry.forEach((entry, index) => {
        if (!entry.resource) {
          warnings.push(`Bundle.entry[${index}] has no resource payload`);
        } else {
          const childVal = validateFhirResource(entry.resource);
          childVal.errors.forEach(err => errors.push(`Bundle.entry[${index}] (${entry.resource.resourceType}): ${err}`));
          childVal.warnings.forEach(warn => warnings.push(`Bundle.entry[${index}]: ${warn}`));
        }
      });
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // 2. Check required fields
  const requiredFields = REQUIRED_FIELDS_BY_RESOURCE[type] || [];
  for (const field of requiredFields) {
    if (resource[field] === undefined || resource[field] === null) {
      errors.push(`${type} missing required FHIR field: "${field}"`);
    }
  }

  // 3. Check status enums if present
  if (resource.status && VALID_STATUS_ENUMS[type]) {
    if (!VALID_STATUS_ENUMS[type].includes(resource.status)) {
      errors.push(`Invalid status value "${resource.status}" for ${type}. Allowed values: ${VALID_STATUS_ENUMS[type].join(', ')}`);
    }
  }

  // 4. Validate reference attributes if present
  const checkReferences = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.reference) {
      if (!isValidReferenceFormat(obj.reference)) {
        warnings.push(`Reference "${obj.reference}" at ${path}.reference may not be standard FHIR format "ResourceType/id"`);
      }
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkReferences(obj[key], `${path}.${key}`);
      }
    }
  };

  checkReferences(resource, type);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resourceType: type,
    id: resource.id
  };
}

module.exports = {
  validateFhirResource,
  VALID_RESOURCE_TYPES,
  VALID_STATUS_ENUMS
};

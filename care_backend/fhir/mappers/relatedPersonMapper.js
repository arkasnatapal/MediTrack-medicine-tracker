/**
 * Mapper: Emergency Contacts & Family Guardians <-> FHIR R4 RelatedPerson Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirRelatedPerson({
  id = null,
  patientId,
  name,
  relationship = 'Emergency Contact',
  phone = '',
  email = ''
}) {
  const relId = String(id || `rel-${patientId}-${Date.now()}`);

  const telecom = [];
  if (phone) telecom.push({ system: 'phone', value: phone, use: 'mobile' });
  if (email) telecom.push({ system: 'email', value: email, use: 'home' });

  return {
    resourceType: 'RelatedPerson',
    id: relId,
    active: true,
    patient: {
      reference: `Patient/${patientId}`
    },
    relationship: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'FAMMEMB',
            display: relationship
          }
        ],
        text: relationship
      }
    ],
    name: [
      {
        text: name
      }
    ],
    telecom: telecom.length > 0 ? telecom : undefined
  };
}

function fromFhirRelatedPerson(fhirRel) {
  if (!fhirRel || fhirRel.resourceType !== 'RelatedPerson') {
    throw new Error('Invalid FHIR RelatedPerson resource');
  }
  const validation = validateFhirResource(fhirRel);
  if (!validation.valid) {
    throw new Error(`FHIR RelatedPerson Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirRel.patient?.reference || '';
  const name = fhirRel.name?.[0]?.text || 'Family Member';
  let phone = '';
  if (Array.isArray(fhirRel.telecom)) {
    const p = fhirRel.telecom.find(t => t.system === 'phone');
    if (p) phone = p.value;
  }

  return {
    fhirId: fhirRel.id,
    patientId: patientRef.replace('Patient/', ''),
    name: name,
    relationship: fhirRel.relationship?.[0]?.text || 'Emergency Contact',
    phone: phone
  };
}

module.exports = { toFhirRelatedPerson, fromFhirRelatedPerson };

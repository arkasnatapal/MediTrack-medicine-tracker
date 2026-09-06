/**
 * Mapper: ABDM / Patient Data Sharing Consent <-> FHIR R4 Consent Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

function toFhirConsent({
  id = null,
  patientId,
  requesterName = 'Hospital Facility',
  purpose = 'OPD Consultation Review',
  status = 'active',
  validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}) {
  const consentId = String(id || `consent-${patientId}-${Date.now()}`);

  return {
    resourceType: 'Consent',
    id: consentId,
    status: status,
    scope: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/consentscope',
          code: 'patient-privacy',
          display: 'Patient Privacy Consent'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'INVOICE',
            display: 'Clinical Health Record Access'
          }
        ]
      }
    ],
    patient: {
      reference: `Patient/${patientId}`
    },
    dateTime: new Date().toISOString(),
    organization: [
      {
        display: requesterName
      }
    ],
    provision: {
      type: status === 'active' ? 'permit' : 'deny',
      period: {
        end: new Date(validUntil).toISOString()
      },
      purpose: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
          code: 'TREAT',
          display: purpose
        }
      ]
    }
  };
}

function fromFhirConsent(fhirConsent) {
  if (!fhirConsent || fhirConsent.resourceType !== 'Consent') {
    throw new Error('Invalid FHIR Consent resource');
  }
  const validation = validateFhirResource(fhirConsent);
  if (!validation.valid) {
    throw new Error(`FHIR Consent Validation Failed: ${validation.errors.join(', ')}`);
  }

  const patientRef = fhirConsent.patient?.reference || '';
  return {
    fhirId: fhirConsent.id,
    patientId: patientRef.replace('Patient/', ''),
    status: fhirConsent.status,
    requesterName: fhirConsent.organization?.[0]?.display || 'Facility'
  };
}

module.exports = { toFhirConsent, fromFhirConsent };

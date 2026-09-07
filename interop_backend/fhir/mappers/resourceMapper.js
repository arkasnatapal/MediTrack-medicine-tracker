/**
 * Universal MediTrack <-> FHIR R4 Entity Mapper
 */

const { getLoincDetails, getSnomedDisplay, getRxNormDisplay } = require('../../services/terminologyService');

function mapPatientToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'Patient-' + Date.now();
  return {
    resourceType: 'Patient',
    id: id,
    identifier: [
      {
        system: 'https://meditrack.org/fhir/patient-id',
        value: data.patientId || data._id || id
      },
      ...(data.abhaNumber ? [{
        system: 'https://abdm.gov.in/abha-number',
        value: data.abhaNumber
      }] : [])
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: data.name || 'Anonymous Patient',
        family: data.lastName || (data.name ? data.name.split(' ').pop() : 'Patient'),
        given: data.firstName ? [data.firstName] : (data.name ? data.name.split(' ').slice(0, -1) : ['Patient'])
      }
    ],
    telecom: [
      ...(data.phone ? [{ system: 'phone', value: data.phone }] : []),
      ...(data.email ? [{ system: 'email', value: data.email }] : [])
    ],
    gender: (data.gender || 'unknown').toLowerCase(),
    birthDate: data.birthDate || data.dob || '1990-01-01',
    address: data.address ? [{ line: [data.address.street || ''], city: data.address.city || '', state: data.address.state || '' }] : []
  };
}

function mapObservationToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'Obs-' + Date.now();
  const loinc = getLoincDetails(data.loincCode || '8310-5');
  return {
    resourceType: 'Observation',
    id: id,
    status: data.status || 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: data.category || 'vital-signs',
            display: 'Vital Signs'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: data.loincCode || '8310-5',
          display: data.display || loinc.display
        }
      ],
      text: data.display || loinc.display
    },
    subject: {
      reference: `Patient/${data.patientId || 'unknown'}`
    },
    effectiveDateTime: data.timestamp || new Date().toISOString(),
    valueQuantity: data.valueQuantity || {
      value: data.value || 37.0,
      unit: data.unit || loinc.ucum,
      system: 'http://unitsofmeasure.org',
      code: data.unit || loinc.ucum
    }
  };
}

function mapEncounterToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'Encounter-' + Date.now();
  return {
    resourceType: 'Encounter',
    id: id,
    status: data.status || 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: data.classCode || 'AMB',
      display: data.classDisplay || 'ambulatory'
    },
    type: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '408443003',
            display: 'General medical consultation'
          }
        ],
        text: data.reason || 'General Consultation'
      }
    ],
    subject: {
      reference: `Patient/${data.patientId || 'unknown'}`
    },
    participant: data.practitionerId ? [
      {
        individual: {
          reference: `Practitioner/${data.practitionerId}`
        }
      }
    ] : [],
    period: {
      start: data.startTime || new Date().toISOString(),
      end: data.endTime || new Date().toISOString()
    }
  };
}

function mapConditionToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'Cond-' + Date.now();
  const snomedDisplay = getSnomedDisplay(data.snomedCode || '59621000');
  return {
    resourceType: 'Condition',
    id: id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: data.clinicalStatus || 'active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: data.verificationStatus || 'confirmed'
        }
      ]
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: data.snomedCode || '59621000',
          display: data.display || snomedDisplay
        }
      ],
      text: data.display || snomedDisplay
    },
    subject: {
      reference: `Patient/${data.patientId || 'unknown'}`
    },
    recordedDate: data.recordedDate || new Date().toISOString()
  };
}

function mapMedicationRequestToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'MedReq-' + Date.now();
  const rxDisplay = getRxNormDisplay(data.rxNormCode || '312961');
  return {
    resourceType: 'MedicationRequest',
    id: id,
    status: data.status || 'active',
    intent: data.intent || 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: data.rxNormCode || '312961',
          display: data.medicationName || rxDisplay
        }
      ],
      text: data.medicationName || rxDisplay
    },
    subject: {
      reference: `Patient/${data.patientId || 'unknown'}`
    },
    authoredOn: data.authoredOn || new Date().toISOString(),
    dosageInstruction: [
      {
        text: data.dosageText || '1 tablet daily oral'
      }
    ]
  };
}

function mapDiagnosticReportToFhir(data, fhirId) {
  const id = fhirId || data.fhirId || 'DiagRep-' + Date.now();
  return {
    resourceType: 'DiagnosticReport',
    id: id,
    status: data.status || 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: data.loincCode || '11502-2',
          display: data.title || 'Laboratory report'
        }
      ],
      text: data.title || 'Laboratory report'
    },
    subject: {
      reference: `Patient/${data.patientId || 'unknown'}`
    },
    effectiveDateTime: data.effectiveDateTime || new Date().toISOString(),
    conclusion: data.conclusion || 'Normal diagnostic findings.'
  };
}

module.exports = {
  mapPatientToFhir,
  mapObservationToFhir,
  mapEncounterToFhir,
  mapConditionToFhir,
  mapMedicationRequestToFhir,
  mapDiagnosticReportToFhir
};

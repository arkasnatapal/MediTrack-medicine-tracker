const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../models/ClinicalResource');
const InteropOrganization = require('../models/Organization');
const store = require('../services/dataStore');
const { mapPatientToFhir, mapObservationToFhir, mapEncounterToFhir, mapConditionToFhir, mapMedicationRequestToFhir } = require('../fhir/mappers/resourceMapper');

// POST /api/v1/sandbox/webhook-echo
router.post('/webhook-echo', (req, res) => {
  res.json({
    status: 'RECEIVED',
    signature: req.headers['x-meditrack-signature'] || 'none',
    eventId: req.headers['x-event-id'] || 'none',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

// POST /api/v1/sandbox/seed
router.post('/seed', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';

  try {
    // Seed synthetic patient: Rahul Verma
    const p1 = mapPatientToFhir({
      name: 'Rahul Verma',
      firstName: 'Rahul',
      lastName: 'Verma',
      phone: '+91-9876543210',
      gender: 'male',
      birthDate: '1988-04-12',
      abhaNumber: '14-8201-9304-8192'
    }, 'Patient-Rahul-Verma');

    await store.saveClinicalResource({
      organizationId: orgId,
      resourceType: 'Patient',
      fhirId: 'Patient-Rahul-Verma',
      patientId: 'Patient-Rahul-Verma',
      status: 'active',
      resource: p1
    });

    // Seed synthetic vitals
    const obs1 = mapObservationToFhir({
      patientId: 'Patient-Rahul-Verma',
      loincCode: '8310-5',
      display: 'Body temperature',
      value: 38.2,
      unit: 'Cel'
    }, 'Obs-Rahul-Temp');

    const obs2 = mapObservationToFhir({
      patientId: 'Patient-Rahul-Verma',
      loincCode: '8480-6',
      display: 'Systolic blood pressure',
      value: 135,
      unit: 'mm[Hg]'
    }, 'Obs-Rahul-BP');

    await store.saveClinicalResource({ organizationId: orgId, resourceType: 'Observation', fhirId: 'Obs-Rahul-Temp', patientId: 'Patient-Rahul-Verma', status: 'final', resource: obs1 });
    await store.saveClinicalResource({ organizationId: orgId, resourceType: 'Observation', fhirId: 'Obs-Rahul-BP', patientId: 'Patient-Rahul-Verma', status: 'final', resource: obs2 });

    // Seed synthetic encounter
    const enc1 = mapEncounterToFhir({
      patientId: 'Patient-Rahul-Verma',
      reason: 'Acute Fever and High Blood Pressure Checkup',
      classCode: 'AMB'
    }, 'Encounter-Rahul-001');

    await store.saveClinicalResource({ organizationId: orgId, resourceType: 'Encounter', fhirId: 'Encounter-Rahul-001', patientId: 'Patient-Rahul-Verma', status: 'finished', resource: enc1 });

    // Seed synthetic condition
    const cond1 = mapConditionToFhir({
      patientId: 'Patient-Rahul-Verma',
      snomedCode: '59621000',
      display: 'Essential hypertension'
    }, 'Cond-Rahul-Hypertension');

    await store.saveClinicalResource({ organizationId: orgId, resourceType: 'Condition', fhirId: 'Cond-Rahul-Hypertension', patientId: 'Patient-Rahul-Verma', status: 'active', resource: cond1 });

    // Seed synthetic prescription
    const med1 = mapMedicationRequestToFhir({
      patientId: 'Patient-Rahul-Verma',
      rxNormCode: '312961',
      medicationName: 'Paracetamol 500 MG Oral Tablet',
      dosageText: '1 tablet every 8 hours as needed for fever'
    }, 'MedReq-Rahul-Paracetamol');

    await store.saveClinicalResource({ organizationId: orgId, resourceType: 'MedicationRequest', fhirId: 'MedReq-Rahul-Paracetamol', patientId: 'Patient-Rahul-Verma', status: 'active', resource: med1 });

    res.json({
      success: true,
      message: 'Sandbox synthetic dataset successfully seeded.',
      seededPatient: 'Patient-Rahul-Verma'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/sandbox/reset
router.post('/reset', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    await store.deleteClinicalResources({ organizationId: orgId });
    if (require('mongoose').connection.readyState === 1) {
      InteropClinicalResource.deleteMany({ organizationId: orgId }).catch(() => {});
    }
    res.json({ success: true, message: 'Sandbox organization data successfully reset.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


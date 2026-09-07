const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../models/ClinicalResource');
const store = require('../services/dataStore');
const { mapPatientToFhir } = require('../fhir/mappers/resourceMapper');
const { isAccessPermitted } = require('../services/consentEngine');
const { dispatchWebhookEvent } = require('../services/webhookEngine');

// GET /api/v1/patients
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const filter = { organizationId: orgId, resourceType: 'Patient' };
    if (req.query.name) {
      filter['resource.name.0.text'] = { $regex: req.query.name, $options: 'i' };
    }

    let patients = [];
    if (require('mongoose').connection.readyState === 1) {
      patients = await InteropClinicalResource.find(filter).limit(100);
    } else {
      patients = await store.findClinicalResources(filter, 100);
    }

    res.json({
      success: true,
      count: patients.length,
      data: patients.map(p => p.resource)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/patients/:id
router.get('/:id', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const permitted = await isAccessPermitted(req.params.id, orgId);
    if (!permitted) {
      return res.status(403).json({ success: false, error: 'Patient consent restricts access to this record.' });
    }

    let patient = null;
    if (require('mongoose').connection.readyState === 1) {
      patient = await InteropClinicalResource.findOne({ organizationId: orgId, resourceType: 'Patient', fhirId: req.params.id });
    }
    if (!patient) {
      patient = await store.findOneClinicalResource({ organizationId: orgId, resourceType: 'Patient', fhirId: req.params.id });
    }

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    res.json({ success: true, data: patient.resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/patients
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const data = req.body;

  const fhirPatient = mapPatientToFhir(data);
  const fhirId = fhirPatient.id;

  const recordData = {
    organizationId: orgId,
    resourceType: 'Patient',
    fhirId: fhirId,
    patientId: fhirId,
    status: 'active',
    resource: fhirPatient
  };

  try {
    const record = await store.saveClinicalResource(recordData);

    if (require('mongoose').connection.readyState === 1) {
      InteropClinicalResource.create(recordData).catch(() => {});
    }

    dispatchWebhookEvent(orgId, 'patient.created', fhirPatient);

    res.status(201).json({ success: true, data: record.resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


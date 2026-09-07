const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../models/ClinicalResource');
const { mapObservationToFhir } = require('../fhir/mappers/resourceMapper');
const { dispatchWebhookEvent } = require('../services/webhookEngine');

// GET /api/v1/observations
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const filter = { organizationId: orgId, resourceType: 'Observation' };
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const observations = await InteropClinicalResource.find(filter).limit(100);
    res.json({ success: true, count: observations.length, data: observations.map(o => o.resource) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/observations
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const data = req.body;

  const fhirObservation = mapObservationToFhir(data);
  const fhirId = fhirObservation.id;

  try {
    const record = await InteropClinicalResource.create({
      organizationId: orgId,
      resourceType: 'Observation',
      fhirId: fhirId,
      patientId: data.patientId || 'unknown',
      status: fhirObservation.status,
      resource: fhirObservation
    });

    dispatchWebhookEvent(orgId, 'observation.created', fhirObservation);

    res.status(201).json({ success: true, data: record.resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

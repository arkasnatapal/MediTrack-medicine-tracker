const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../models/ClinicalResource');
const { mapEncounterToFhir } = require('../fhir/mappers/resourceMapper');
const { dispatchWebhookEvent } = require('../services/webhookEngine');

// GET /api/v1/encounters
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const filter = { organizationId: orgId, resourceType: 'Encounter' };
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const encounters = await InteropClinicalResource.find(filter).limit(100);
    res.json({ success: true, count: encounters.length, data: encounters.map(e => e.resource) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/encounters
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const data = req.body;

  const fhirEncounter = mapEncounterToFhir(data);
  const fhirId = fhirEncounter.id;

  try {
    const record = await InteropClinicalResource.create({
      organizationId: orgId,
      resourceType: 'Encounter',
      fhirId: fhirId,
      patientId: data.patientId || 'unknown',
      status: fhirEncounter.status,
      resource: fhirEncounter
    });

    dispatchWebhookEvent(orgId, 'encounter.created', fhirEncounter);

    res.status(201).json({ success: true, data: record.resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

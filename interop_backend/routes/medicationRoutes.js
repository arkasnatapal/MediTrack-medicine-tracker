const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../models/ClinicalResource');
const { mapMedicationRequestToFhir } = require('../fhir/mappers/resourceMapper');

// GET /api/v1/medications
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const filter = { organizationId: orgId, resourceType: 'MedicationRequest' };
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const items = await InteropClinicalResource.find(filter).limit(100);
    res.json({ success: true, count: items.length, data: items.map(i => i.resource) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/medications
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const data = req.body;

  const fhirMedReq = mapMedicationRequestToFhir(data);
  const fhirId = fhirMedReq.id;

  try {
    const record = await InteropClinicalResource.create({
      organizationId: orgId,
      resourceType: 'MedicationRequest',
      fhirId: fhirId,
      patientId: data.patientId || 'unknown',
      status: fhirMedReq.status,
      resource: fhirMedReq
    });

    res.status(201).json({ success: true, data: record.resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

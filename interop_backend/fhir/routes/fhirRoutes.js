const express = require('express');
const router = express.Router();
const InteropClinicalResource = require('../../models/ClinicalResource');
const store = require('../../services/dataStore');
const { validateFhirResource, createOperationOutcome } = require('../fhirValidator');
const { generatePatientEverythingBundle } = require('../fhirBundle');
const { logAuditEvent } = require('../../services/auditEngine');
const { dispatchWebhookEvent } = require('../../services/webhookEngine');

// GET /fhir/Patient/:id/$everything
router.get('/Patient/:id/\\$everything', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    const bundle = await generatePatientEverythingBundle(orgId, req.params.id);
    await logAuditEvent({
      type: 'FHIR-BUNDLE-EXPORT',
      action: 'R',
      actor: req.user,
      resourceType: 'Patient',
      resourceId: req.params.id,
      requestPath: req.originalUrl,
      method: 'GET'
    });
    res.json(bundle);
  } catch (err) {
    res.status(500).json(createOperationOutcome('error', 'exception', err.message));
  }
});

// POST /fhir/Bundle/import
router.post('/Bundle/import', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const bundle = req.body;

  if (!bundle || bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
    return res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid FHIR Bundle object.'));
  }

  const imported = [];
  for (const item of bundle.entry) {
    if (item.resource && item.resource.resourceType) {
      const resource = item.resource;
      const fhirId = resource.id || `${resource.resourceType}-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      resource.id = fhirId;

      const recordData = {
        organizationId: orgId,
        resourceType: resource.resourceType,
        fhirId: fhirId,
        patientId: resource.subject ? resource.subject.reference.replace('Patient/', '') : (resource.resourceType === 'Patient' ? fhirId : null),
        status: resource.status || 'active',
        resource: resource
      };

      await store.saveClinicalResource(recordData);
      if (require('mongoose').connection.readyState === 1) {
        InteropClinicalResource.findOneAndUpdate(
          { organizationId: orgId, resourceType: resource.resourceType, fhirId: fhirId },
          recordData,
          { upsert: true, new: true }
        ).catch(() => {});
      }
      imported.push(fhirId);
    }
  }

  res.json({
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'information',
        code: 'informational',
        details: { text: `Successfully imported ${imported.length} resources.` }
      }
    ]
  });
});

// GET /fhir/:resourceType
router.get('/:resourceType', async (req, res) => {
  const { resourceType } = req.params;
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';

  try {
    const filter = { organizationId: orgId, resourceType: resourceType };

    if (req.query.patient) {
      filter.patientId = req.query.patient;
    }
    if (req.query.name) {
      filter['resource.name.0.text'] = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    let records = [];
    if (require('mongoose').connection.readyState === 1) {
      records = await InteropClinicalResource.find(filter).limit(100);
    } else {
      records = await store.findClinicalResources(filter, 100);
    }

    const entries = records.map(r => ({
      fullUrl: `http://localhost:5002/fhir/${r.resourceType}/${r.fhirId}`,
      resource: r.resource
    }));

    await logAuditEvent({
      type: 'FHIR-SEARCH',
      action: 'R',
      actor: req.user,
      resourceType: resourceType,
      requestPath: req.originalUrl,
      method: 'GET'
    });

    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries
    });
  } catch (err) {
    res.status(500).json(createOperationOutcome('error', 'exception', err.message));
  }
});

// GET /fhir/:resourceType/:id
router.get('/:resourceType/:id', async (req, res) => {
  const { resourceType, id } = req.params;
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';

  try {
    let item = null;
    if (require('mongoose').connection.readyState === 1) {
      item = await InteropClinicalResource.findOne({ organizationId: orgId, resourceType: resourceType, fhirId: id });
    }
    if (!item) {
      item = await store.findOneClinicalResource({ organizationId: orgId, resourceType: resourceType, fhirId: id });
    }

    if (!item) {
      return res.status(404).json(createOperationOutcome('error', 'not-found', `${resourceType}/${id} not found.`));
    }

    await logAuditEvent({
      type: 'FHIR-READ',
      action: 'R',
      actor: req.user,
      resourceType: resourceType,
      resourceId: id,
      requestPath: req.originalUrl,
      method: 'GET'
    });

    res.json(item.resource);
  } catch (err) {
    res.status(500).json(createOperationOutcome('error', 'exception', err.message));
  }
});

// POST /fhir/:resourceType
router.post('/:resourceType', async (req, res) => {
  const { resourceType } = req.params;
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const payload = req.body;

  payload.resourceType = resourceType;

  const validation = validateFhirResource(payload);
  if (!validation.valid) {
    return res.status(400).json(validation.operationOutcome);
  }

  const fhirId = payload.id || `${resourceType}-${Date.now()}`;
  payload.id = fhirId;

  const recordData = {
    organizationId: orgId,
    resourceType: resourceType,
    fhirId: fhirId,
    patientId: payload.subject ? payload.subject.reference.replace('Patient/', '') : (resourceType === 'Patient' ? fhirId : null),
    status: payload.status || 'active',
    resource: payload
  };

  try {
    const record = await store.saveClinicalResource(recordData);

    if (require('mongoose').connection.readyState === 1) {
      InteropClinicalResource.create(recordData).catch(() => {});
    }

    await logAuditEvent({
      type: 'FHIR-CREATE',
      action: 'C',
      actor: req.user,
      resourceType: resourceType,
      resourceId: fhirId,
      requestPath: req.originalUrl,
      method: 'POST'
    });

    // Trigger webhook event
    const eventName = `${resourceType.toLowerCase()}.created`;
    dispatchWebhookEvent(orgId, eventName, payload);

    res.status(201).json(record.resource);
  } catch (err) {
    res.status(500).json(createOperationOutcome('error', 'exception', err.message));
  }
});

// PUT /fhir/:resourceType/:id
router.put('/:resourceType/:id', async (req, res) => {
  const { resourceType, id } = req.params;
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const payload = req.body;

  payload.resourceType = resourceType;
  payload.id = id;

  const validation = validateFhirResource(payload);
  if (!validation.valid) {
    return res.status(400).json(validation.operationOutcome);
  }

  const recordData = {
    organizationId: orgId,
    resourceType: resourceType,
    fhirId: id,
    patientId: payload.subject ? payload.subject.reference.replace('Patient/', '') : (resourceType === 'Patient' ? id : null),
    status: payload.status || 'active',
    resource: payload
  };

  try {
    const record = await store.saveClinicalResource(recordData);

    if (require('mongoose').connection.readyState === 1) {
      InteropClinicalResource.findOneAndUpdate(
        { organizationId: orgId, resourceType: resourceType, fhirId: id },
        recordData,
        { upsert: true, new: true }
      ).catch(() => {});
    }

    await logAuditEvent({
      type: 'FHIR-UPDATE',
      action: 'U',
      actor: req.user,
      resourceType: resourceType,
      resourceId: id,
      requestPath: req.originalUrl,
      method: 'PUT'
    });

    res.json(record.resource);
  } catch (err) {
    res.status(500).json(createOperationOutcome('error', 'exception', err.message));
  }
});

module.exports = router;


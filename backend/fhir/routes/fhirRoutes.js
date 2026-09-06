/**
 * HL7 FHIR R4 REST API Router for MediTrack.
 * Standard FHIR R4 API surface with authentication, authorization,
 * FHIR content-type headers, audit logging, search, import & export.
 */

const express = require('express');
const router = express.Router();
const fhirService = require('../services/fhirService');
const { validateFhirResource } = require('../validators/fhirValidator');
const FhirAuditEvent = require('../../models/FhirAuditEvent');
const offlineQueueService = require('../services/offlineQueueService');
const syncService = require('../services/syncService');

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Middleware to enforce application/fhir+json headers, decode auth token, and auto-scope queries
router.use(async (req, res, next) => {
  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.setHeader('X-FHIR-Version', '4.0.1');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'meditrack_care_network_super_secret_key_2026';
      const decoded = jwt.verify(token, secret);
      
      let currentUser = null;
      const uid = decoded.id || decoded.userId || decoded._id;
      if (uid) {
        const isObjId = mongoose.Types.ObjectId.isValid(String(uid));
        const careDoc = await mongoose.connection.collection('careusers').findOne({
          _id: isObjId ? new mongoose.Types.ObjectId(String(uid)) : String(uid)
        }).catch(() => null);

        if (careDoc) {
          currentUser = careDoc;
        } else if (mongoose.models.CareUser) {
          currentUser = await mongoose.models.CareUser.findById(uid).select('role facilityId doctorId').catch(() => null);
        } else if (mongoose.models.User) {
          currentUser = await mongoose.models.User.findById(uid).select('role facilityId doctorId').catch(() => null);
        }
      }

      if (currentUser) {
        req.user = currentUser;

        // Auto-populate query params if not explicitly provided
        if (!req.query.facilityId && !req.query.doctorId) {
          const role = (currentUser.role || '').toUpperCase();
          if (role === 'FACILITY_ADMIN' || role === 'FACILITY' || role === 'FACILITY_STAFF' || role === 'LAB_STAFF' || role === 'PHARMACY_STAFF') {
            const facId = currentUser.facilityId?._id || currentUser.facilityId;
            if (facId) req.query.facilityId = String(facId);
          } else if (role === 'DOCTOR') {
            const docId = currentUser.doctorId?._id || currentUser.doctorId;
            if (docId) {
              req.query.doctorId = String(docId);
            } else if (currentUser.facilityId) {
              req.query.facilityId = String(currentUser.facilityId._id || currentUser.facilityId);
            }
          }
        }
      }
    } catch (err) {
      // Ignored non-fatal auth token decode error
    }
  }

  next();
});

// Helper for Audit Logging
async function logAudit(action, resourceType, resourceId, user = 'Anonymous', outcome = 'SUCCESS') {
  try {
    await FhirAuditEvent.create({
      action: action,
      resourceType: resourceType,
      resourceId: String(resourceId || 'unknown'),
      performedBy: user,
      outcome: outcome
    });
  } catch (e) {
    // Non-blocking log
  }
}

// ----------------------------------------------------
// PATIENT $EVERYTHING EXPORT
// ----------------------------------------------------
router.get('/Patient/:id/\\$everything', async (req, res) => {
  try {
    const bundle = await fhirService.getPatientEverythingBundle(req.params.id);
    await logAudit('READ', 'Patient', req.params.id, req.user?.id || 'APIUser');
    res.json(bundle);
  } catch (err) {
    await logAudit('READ', 'Patient', req.params.id, 'APIUser', 'FAILED');
    res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'not-found',
          diagnostics: err.message
        }
      ]
    });
  }
});

// ----------------------------------------------------
// BUNDLE & GENERAL IMPORT ENDPOINTS: POST /fhir/Bundle/import or /fhir/import
// ----------------------------------------------------
router.post('/Bundle/import', async (req, res) => {
  try {
    const result = await fhirService.importFhirResourceOrBundle(req.body, req.user);
    await logAudit('IMPORT', 'Bundle', 'batch', req.user?.id || 'APIUser');
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'invalid', diagnostics: err.message }]
    });
  }
});

router.post('/import', async (req, res) => {
  try {
    const result = await fhirService.importFhirResourceOrBundle(req.body, req.user);
    await logAudit('IMPORT', 'Bundle', 'batch', req.user?.id || 'APIUser');
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'invalid', diagnostics: err.message }]
    });
  }
});

// ----------------------------------------------------
// OFFLINE QUEUE STATUS & SYNC TRIGGER
// ----------------------------------------------------
router.get('/queue/pending', async (req, res) => {
  try {
    const queue = await offlineQueueService.getPendingQueue();
    res.json({ status: 'OK', count: queue.length, pendingQueue: queue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/queue/sync', async (req, res) => {
  try {
    const { externalUrl } = req.body;
    const result = await syncService.processSyncQueue(externalUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// FHIR SEARCH API: GET /fhir/:resourceType
// ----------------------------------------------------
router.get('/:resourceType', async (req, res) => {
  const { resourceType } = req.params;
  try {
    const searchBundle = await fhirService.searchResources(resourceType, req.query);
    await logAudit('SEARCH', resourceType, 'query', req.user?.id || 'APIUser');
    res.json(searchBundle);
  } catch (err) {
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
    });
  }
});

// ----------------------------------------------------
// READ RESOURCE BY TYPE & ID: GET /fhir/:resourceType/:id
// ----------------------------------------------------
router.get('/:resourceType/:id', async (req, res) => {
  const { resourceType, id } = req.params;
  try {
    const resource = await fhirService.getResource(resourceType, id);
    if (!resource) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found', diagnostics: `${resourceType}/${id} not found` }]
      });
    }
    await logAudit('READ', resourceType, id, req.user?.id || 'APIUser');
    res.json(resource);
  } catch (err) {
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
    });
  }
});

// ----------------------------------------------------
// CREATE / IMPORT RESOURCE: POST /fhir/:resourceType
// ----------------------------------------------------
router.post('/:resourceType', async (req, res) => {
  const { resourceType } = req.params;
  const payload = req.body;

  if (payload.resourceType && payload.resourceType !== resourceType && resourceType !== 'Bundle') {
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'invalid', diagnostics: `URL resourceType (${resourceType}) does not match body (${payload.resourceType})` }]
    });
  }

  try {
    const valResult = validateFhirResource(payload);
    if (!valResult.valid) {
      return res.status(422).json({
        resourceType: 'OperationOutcome',
        issue: valResult.errors.map(err => ({ severity: 'error', code: 'invalid', diagnostics: err }))
      });
    }

    const importRes = await fhirService.importFhirResourceOrBundle(payload);
    await logAudit('CREATE', resourceType, payload.id || 'new', req.user?.id || 'APIUser');
    res.status(201).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'information', code: 'informational', diagnostics: `Successfully imported ${resourceType}` }],
      details: importRes
    });
  } catch (err) {
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
    });
  }
});

module.exports = router;

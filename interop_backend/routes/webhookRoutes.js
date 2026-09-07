const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const InteropWebhookSubscription = require('../models/WebhookSubscription');
const InteropWebhookDeliveryLog = require('../models/WebhookDeliveryLog');
const store = require('../services/dataStore');

// GET /api/v1/webhooks
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    let subs = [];
    if (require('mongoose').connection.readyState === 1) {
      subs = await InteropWebhookSubscription.find({ organizationId: orgId });
    } else {
      subs = await store.findWebhooks({ organizationId: orgId });
    }
    res.json({ success: true, count: subs.length, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/webhooks
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const { name, url, events } = req.body;

  if (!url || !events) {
    return res.status(400).json({ success: false, error: 'url and events are required.' });
  }

  const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');

  const subData = {
    organizationId: orgId,
    name: name || 'Hospital Webhook Listener',
    url,
    secret,
    events: Array.isArray(events) ? events : [events],
    active: true
  };

  try {
    const sub = await store.createWebhook(subData);

    if (require('mongoose').connection.readyState === 1) {
      InteropWebhookSubscription.create(subData).catch(() => {});
    }

    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webhooks/logs
router.get('/logs', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    let logs = [];
    if (require('mongoose').connection.readyState === 1) {
      logs = await InteropWebhookDeliveryLog.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(50);
    } else {
      logs = await store.findWebhookLogs({ organizationId: orgId }, 50);
    }
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/webhooks/:id
router.delete('/:id', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    await store.deleteWebhook(req.params.id, orgId);
    if (require('mongoose').connection.readyState === 1) {
      InteropWebhookSubscription.deleteOne({ _id: req.params.id, organizationId: orgId }).catch(() => {});
    }
    res.json({ success: true, message: 'Webhook subscription deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const InteropApiClient = require('../models/ApiClient');
const store = require('../services/dataStore');

// GET /api/v1/clients
router.get('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    let clients = [];
    if (require('mongoose').connection.readyState === 1) {
      clients = await InteropApiClient.find({ organizationId: orgId }).select('-clientSecretHash');
    } else {
      clients = await store.findClients({ organizationId: orgId });
    }
    res.json({ success: true, count: clients.length, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/clients
router.post('/', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  const { name, scopes, role } = req.body;

  const clientId = 'cli_' + (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'app') + '_' + Math.random().toString(36).substr(2, 6);
  const rawSecret = 'sec_' + crypto.randomBytes(16).toString('hex');
  const secretHash = await bcrypt.hash(rawSecret, 10);

  const clientData = {
    clientId,
    clientSecretHash: secretHash,
    rawSecret: rawSecret,
    name: name || 'Hospital Integration Client',
    organizationId: orgId,
    scopes: scopes || ['patient/*.read', 'observation/*.write', 'encounter/*.read'],
    role: role || 'Integration Client',
    active: true
  };

  try {
    const client = await store.createClient(clientData);

    if (require('mongoose').connection.readyState === 1) {
      InteropApiClient.create(clientData).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Save client_secret securely. It will be required for token generation.',
      data: {
        clientId: client.clientId,
        clientSecret: rawSecret,
        name: client.name,
        organizationId: client.organizationId,
        scopes: client.scopes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


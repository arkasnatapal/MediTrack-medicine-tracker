const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const InteropApiClient = require('../models/ApiClient');
const store = require('../services/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_interop_super_secret_jwt_key_2026';

// POST /api/v1/auth/token - OAuth 2.0 Client Credentials Token Exchange
router.post('/token', async (req, res) => {
  const { grant_type, client_id, client_secret } = req.body;

  if (grant_type !== 'client_credentials' && !client_id) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'grant_type must be client_credentials' });
  }

  try {
    let client = null;
    if (require('mongoose').connection.readyState === 1) {
      client = await InteropApiClient.findOne({ clientId: client_id, active: true });
    }
    if (!client) {
      client = await store.findOneClient({ clientId: client_id, active: true });
    }

    if (!client) {
      return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid Client ID or Client Secret' });
    }

    let isValidSecret = false;
    if (client.clientSecretHash) {
      isValidSecret = await bcrypt.compare(client_secret, client.clientSecretHash);
    }
    if (!isValidSecret && client_secret === client.rawSecret) {
      isValidSecret = true;
    }

    if (!isValidSecret) {
      return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid Client Secret' });
    }

    const payload = {
      sub: client.clientId,
      org_id: client.organizationId,
      scopes: client.scopes || ['*'],
      roles: [client.role || 'Integration Client']
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: (client.scopes || []).join(' '),
      organization_id: client.organizationId
    });
  } catch (err) {
    res.status(500).json({ error: 'server_error', error_description: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

module.exports = router;


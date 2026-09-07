const express = require('express');
const router = express.Router();
const InteropAuditEvent = require('../models/AuditEvent');
const store = require('../services/dataStore');

// GET /api/v1/audit/logs
router.get('/logs', async (req, res) => {
  const orgId = req.user ? req.user.org_id : 'org_apollo_metro';
  try {
    let logs = [];
    if (require('mongoose').connection.readyState === 1) {
      logs = await InteropAuditEvent.find({ 'actor.orgId': orgId }).sort({ createdAt: -1 }).limit(100);
    }
    if (!logs || logs.length === 0) {
      logs = await store.findAuditLogs({ orgId }, 100);
    }

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

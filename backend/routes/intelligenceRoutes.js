const express = require('express');
const router = express.Router();
const { getIntelligence, refreshIntelligence } = require('../controllers/intelligenceController');
const auth = require('../middleware/authMiddleware');

// GET /api/dashboard/intelligence - Get latest snapshot
router.get('/', auth, getIntelligence);

// POST /api/dashboard/intelligence/refresh - Manual refresh
router.post('/refresh', auth, refreshIntelligence);

module.exports = router;

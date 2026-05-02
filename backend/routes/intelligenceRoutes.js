const express = require('express');
const router = express.Router();
const { getIntelligence, refreshIntelligence } = require('../controllers/intelligenceController');
const { getDailyInsight } = require('../controllers/dailyInsightController');
const auth = require('../middleware/authMiddleware');

// GET /api/dashboard/intelligence - Get latest snapshot
router.get('/', auth, getIntelligence);

// POST /api/dashboard/intelligence/refresh - Manual refresh
router.post('/refresh', auth, refreshIntelligence);

// GET /api/dashboard/intelligence/daily-insight - Get daily AI insight
router.get('/daily-insight', auth, getDailyInsight);

module.exports = router;

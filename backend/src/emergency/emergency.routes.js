const express = require('express');
const router = express.Router();
const emergencyController = require('./emergency.controller');
const protect = require('../../middleware/authMiddleware');

router.post('/trigger', protect, emergencyController.triggerEmergency);
router.post('/ai-recommendation', protect, emergencyController.getAIRecommendation);
router.get('/hospitals', protect, emergencyController.getNearbyHospitals);
router.post('/assign-doctor', protect, emergencyController.assignDoctor);
router.get('/history', protect, emergencyController.getHistory);
router.delete('/:id', protect, emergencyController.deleteEmergency);

module.exports = router;

const express = require('express');
const router = express.Router();
const ayurvedicController = require('../controllers/ayurvedicController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, ayurvedicController.getProfile);
router.post('/feedback', protect, ayurvedicController.updateFeedback);
router.post('/regenerate', protect, ayurvedicController.regenerateProfile);
router.post('/reminders/sync', protect, ayurvedicController.syncReminders);
router.post('/reminders/schedule', protect, ayurvedicController.scheduleReminders);
router.delete('/reminders/:reminderId', protect, ayurvedicController.deleteReminder);

module.exports = router;

const express = require('express');
const router = express.Router();
const { executeReminderCheck } = require('../jobs/reminderScheduler');
const { checkGracePeriod } = require('../jobs/gracePeriodCheck');
const { checkExpiredMedicines } = require('../jobs/cronJobs');
const { sendCheckupReminders } = require('../utils/checkupReminders');

// Middleware to verify CRON_SECRET
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers['x-cron-secret'] || req.headers['authorization'];
  const querySecret = req.query.secret;
  
  // Check authorization header (Bearer token or direct secret)
  const providedSecret = authHeader?.replace('Bearer ', '') || querySecret;

  if (providedSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
  }
  next();
};

// Apply middleware to all routes in this router
router.use(verifyCronSecret);

// POST /api/cron/run-reminder-check
router.post('/run-reminder-check', async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Reminder Check');
    await executeReminderCheck();
    res.status(200).json({ success: true, message: 'Reminder check executed' });
  } catch (error) {
    console.error('❌ Error executing reminder check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cron/check-grace-period
router.post('/check-grace-period', async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Grace Period Check');
    await checkGracePeriod();
    res.status(200).json({ success: true, message: 'Grace period check executed' });
  } catch (error) {
    console.error('❌ Error executing grace period check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cron/check-expired-medicines
router.post('/check-expired-medicines', async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Expired Medicines Check');
    await checkExpiredMedicines();
    res.status(200).json({ success: true, message: 'Expired medicines check executed' });
  } catch (error) {
    console.error('❌ Error executing expired medicines check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cron/checkup-reminders
router.post('/checkup-reminders', async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Checkup Reminders Check');
    await sendCheckupReminders();
    res.status(200).json({ success: true, message: 'Checkup reminders check executed' });
  } catch (error) {
    console.error('❌ Error executing checkup reminders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Living OS Queues
const { 
  healthScanQueue, 
  sleepIntelligenceQueue, 
  riskEscalationQueue, 
  improvementDetectionQueue,
  medicinePatternQueue
} = require('../src/living-os/queues');

// --- LIVING HEALTH OS TRIGGERS ---

// POST /api/cron/trigger-daily-health
router.post('/trigger-daily-health', async (req, res) => {
  try {
    console.log('🧠 Triggering Daily Health Intelligence...');
    await sleepIntelligenceQueue.add('analyze-sleep', {});
    await medicinePatternQueue.add('check-patterns', {});
    await healthScanQueue.add('trigger-daily-scan', {});
    res.json({ success: true, message: 'Daily routines enqueued' });
  } catch (error) {
    console.error('Trigger Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cron/trigger-risk-check
router.post('/trigger-risk-check', async (req, res) => {
  try {
    await riskEscalationQueue.add('check-risks', {});
    res.json({ success: true, message: 'Risk check enqueued' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cron/trigger-weekly-check
router.post('/trigger-weekly-check', async (req, res) => {
  try {
    await improvementDetectionQueue.add('check-improvements', {});
    res.json({ success: true, message: 'Weekly improvement check enqueued' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const createWorker = require('./workerFactory');
const User = require('../../../models/User');
const { shouldNotify, generateMessage } = require('../intelligence/notificationEngine');

const riskEscalationWorker = createWorker('risk-escalation-queue', async (job) => {
  console.log(`🚨 [Risk Escalation] Checking critical states...`);
  
  // 1. Find users in Critical State (RED) who haven't been alerted in 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const criticalUsers = await User.find({
    healthState: 'RED',
    $or: [
      { lastRiskAlert: null },
      { lastRiskAlert: { $lt: twentyFourHoursAgo } }
    ]
  });

  console.log(`[Risk Escalation] Found ${criticalUsers.length} users requiring attention.`);

  for (const user of criticalUsers) {
    try {
        // A. Create In-App Notification
        const Notification = require('../../../models/Notification'); // Lazy load
        const { sendRiskAlertEmail } = require('../../../utils/email'); // Lazy load

        await Notification.create({
            user: user._id,
            type: 'risk_alert',
            title: 'Critical Health Score Drop',
            message: `Your health score has dropped to ${user.healthScore}. Please review your medicine log.`,
            severity: 'error',
            read: false
        });

        // B. Send Email Alert
        await sendRiskAlertEmail({
            to: user.email,
            name: user.name,
            score: user.healthScore || 0,
            issues: ['Consistent missed doses detected', 'Health score in red zone'], // Mock reasons if not strictly stored
            suggestions: ['Resume medication immediately', 'Contact support if app issue']
        });

        // C. Update User timestamp to avoid spam
        user.lastRiskAlert = new Date();
        await user.save();

        console.log(`🚨 ALERT SENT to ${user.email}`);

    } catch (err) {
        console.error(`Failed to process risk for ${user.email}:`, err);
    }
  }
});

module.exports = riskEscalationWorker;

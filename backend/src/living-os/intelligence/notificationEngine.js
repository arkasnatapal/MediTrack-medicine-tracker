/**
 * Notification Intelligence Engine
 * "Smart, non-spammy notifications"
 */

const NOTIFICATION_COOLDOWN_HOURS = 4;

/**
 * Decides if a notification should be sent
 * @param {Object} user 
 * @param {string} notificationType 
 * @param {Object} context 
 */
const shouldNotify = async (user, notificationType, context) => {
  // Check cooldowns (mock implementation - would check DB/Redis)
  // Logic: 
  // 1. Is this urgent? (Risk degradation) -> Bypass cooldown
  // 2. Is this informational? -> Check if sent recently
  
  if (notificationType === 'RISK_ESCALATION') return true;
  
  // For now, allow daily summaries
  if (notificationType === 'DAILY_SUMMARY') return true;

  return true; 
};

/**
 * Generates human-like message
 */
const generateMessage = (type, data) => {
  switch (type) {
    case 'HEALTH_DEGRADATION':
      return `We've noticed a slight dip in your routine. Establishing a consistent sleep pattern might help getting back to Green.`;
    case 'IMPROVEMENT':
      return `Great work! Your consistency is up 15% this week. Keep it up!`;
    case 'MEDICINE_REMINDER':
      return `It looks like you missed the morning dose. Everything okay?`;
    default:
      return 'New health insight available.';
  }
};

module.exports = {
  shouldNotify,
  generateMessage
};

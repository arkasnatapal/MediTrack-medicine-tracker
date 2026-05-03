/**
 * Activity Tracker Middleware
 * Passive sleep tracking: Logs the timestamp of the request.
 */
// [REMOVED] Redis dependency
const logActivity = async (userId) => {
  // Mock: Do nothing for now since Redis is removed.
  // In a future update, this could be moved to MongoDB.
  return;
};

const activityTracker = (req, res, next) => {
  // Passive tracking disabled along with Redis
  next();
};

module.exports = {
  activityTracker,
  logActivity
};


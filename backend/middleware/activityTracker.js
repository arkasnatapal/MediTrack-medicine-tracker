/**
 * Activity Tracker Middleware
 * Passive sleep tracking: Logs the timestamp of the request.
 */
// Helper to update activity
const { connection } = require('../src/living-os/config/redis');
const logActivity = async (userId) => {
  try {
    const now = new Date();
    const key = `daily_activity:${userId}:${now.toISOString().split('T')[0]}`; // daily_activity:USERID:2024-01-01
    
    // We store the FIRST activity of the day and LAST activity of the day in Redis
    // specialized hash for quick sleep calculation.
    
    // Fields: first_active, last_active, total_requests
    // We use a Redis Hash.
    
    const exists = await connection.exists(key);
    
    if (!exists) {
      // First activity of the day
      await connection.hset(key, {
        first_active: now.toISOString(),
        last_active: now.toISOString(),
        total_requests: 1
      });
      // Set expiry for 48 hours to allow yesterday-comparison
      await connection.expire(key, 172800); 
    } else {
      // Update last active
      await connection.hset(key, {
        last_active: now.toISOString()
      });
      await connection.hincrby(key, 'total_requests', 1);
    }
    
  } catch (error) {
    // Fail silently, don't block the request
    console.error('Activity Tracker Error:', error.message);
  }
};

const activityTracker = (req, res, next) => {
  if (req.user && req.user._id) {
    logActivity(req.user._id);
  }
  next();
};

// Export both the middleware and the helper
module.exports = {
  activityTracker,
  logActivity
};

/**
 * Sleep Intelligence Engine
 * Infers sleep patterns from passive activity logs.
 */

// [REMOVED] Redis dependency
/**
 * Infers sleep data for a user for a specific date
 * Mock version: Returns default sleep data since Redis tracking is disabled.
 */
const inferSleepFromActivity = async (userId) => {
  // Mock fallback: Assume 7 hours of sleep if data is missing
  return {
    inferred: false,
    reason: 'Passive tracking disabled',
    durationHours: 7,
    consistencyScore: 85
  };
};

module.exports = {
  inferSleepFromActivity
};


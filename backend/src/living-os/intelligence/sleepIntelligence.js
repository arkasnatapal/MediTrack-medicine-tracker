/**
 * Sleep Intelligence Engine
 * Infers sleep patterns from passive activity logs.
 */

const { connection } = require('../config/redis');

/**
 * Infers sleep data for a user for a specific date (processing yesterday's data)
 * @param {string} userId 
 * @param {string} dateString YYYY-MM-DD (The "Day" to analyze sleep FOR)
 * Actually, we usually analyze the sleep that ended ON dateString (morning)
 * or likely the sleep between dateString-1 and dateString.
 * Let's assume we run this in the morning of T to analyze sleep of T-1 night.
 */
const inferSleepFromActivity = async (userId) => {
  // Logic:
  // Get Last Active of Yesterday (T-1)
  // Get First Active of Today (T)
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const keyToday = `daily_activity:${userId}:${todayStr}`;
  const keyYesterday = `daily_activity:${userId}:${yesterdayStr}`;
  
  const [firstActiveToday] = await connection.hmget(keyToday, 'first_active');
  const [lastActiveYesterday] = await connection.hmget(keyYesterday, 'last_active');
  
  if (!firstActiveToday || !lastActiveYesterday) {
    return {
      inferred: false,
      reason: 'Insufficient data'
    };
  }

  const sleepStart = new Date(lastActiveYesterday);
  const wakeUp = new Date(firstActiveToday);
  
  // Calculate difference in hours
  const diffMs = wakeUp - sleepStart;
  const durationHours = diffMs / (1000 * 60 * 60);

  // Consistency Score inference (simple placeholder)
  // Real logic would compare with average wake up time
  const consistencyScore = 80; 

  return {
    inferred: true,
    sleepStart,
    wakeUp,
    durationHours,
    consistencyScore
  };
};

module.exports = {
  inferSleepFromActivity
};

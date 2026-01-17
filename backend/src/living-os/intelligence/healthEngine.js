/**
 * Health Intelligence Engine (Rule-Based)
 * Logic for calculating health scores and determining states.
 */

// Heuristic weights
const WEIGHTS = {
  MEDICINE_ADHERENCE: 0.6,
  SLEEP_QUALITY: 0.3,
  VITALS: 0.1 // placeholder for future
};

// Thresholds
const THRESHOLDS = {
  GREEN: 80,
  YELLOW: 50
};

/**
 * Calculates the daily health score (0-100)
 * @param {Object} adherenceStats - { taken, total, onTime }
 * @param {Object} sleepStats - { durationHours, consistencyScore }
 * @returns {number} score
 */
const calculateHealthScore = (adherenceStats, sleepStats) => {
  let medicineScore = 0;
  if (adherenceStats.total > 0) {
    const accuracy = adherenceStats.taken / adherenceStats.total;
    const punctuality = adherenceStats.onTime / adherenceStats.taken || 0;
    medicineScore = (accuracy * 0.7 + punctuality * 0.3) * 100;
  } else {
    medicineScore = 100; // No meds = perfect score? Or neutral. Let's say 100 if no meds assigned.
  }

  let sleepScore = 0;
  // ideal sleep 7-9 hours
  if (sleepStats.durationHours) {
    if (sleepStats.durationHours >= 7 && sleepStats.durationHours <= 9) sleepScore = 100;
    else if (sleepStats.durationHours >= 5) sleepScore = 70;
    else sleepScore = 40;
  }
  
  // Consistency bonus/penalty
  if (sleepStats.consistencyScore) {
    sleepScore = (sleepScore + sleepStats.consistencyScore) / 2;
  }

  const totalScore = (medicineScore * WEIGHTS.MEDICINE_ADHERENCE) + 
                     (sleepScore * WEIGHTS.SLEEP_QUALITY) + 
                     (100 * WEIGHTS.VITALS); // Assume perfect vitals for now

  return Math.round(totalScore);
};

/**
 * Determines Health State based on score
 * @param {number} score 
 * @returns {string} 'GREEN' | 'YELLOW' | 'RED'
 */
const determineHealthState = (score) => {
  if (score >= THRESHOLDS.GREEN) return 'GREEN';
  if (score >= THRESHOLDS.YELLOW) return 'YELLOW';
  return 'RED';
};

module.exports = {
  calculateHealthScore,
  determineHealthState
};

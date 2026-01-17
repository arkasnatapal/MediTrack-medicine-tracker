const createWorker = require('./workerFactory');

const improvementDetectionWorker = createWorker('improvement-detection-queue', async (job) => {
  console.log(`📈 [Improvement] Detecting positive trends...`);
  // Logic: Compare this week's avg score vs last week.
});

module.exports = improvementDetectionWorker;

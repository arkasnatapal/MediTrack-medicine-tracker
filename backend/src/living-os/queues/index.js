const createQueue = require('./queueFactory');

const healthScanQueue = createQueue('health-scan-queue');
const medicinePatternQueue = createQueue('medicine-pattern-queue');
const sleepIntelligenceQueue = createQueue('sleep-intelligence-queue');
const riskEscalationQueue = createQueue('risk-escalation-queue');
const improvementDetectionQueue = createQueue('improvement-detection-queue');

module.exports = {
  healthScanQueue,
  medicinePatternQueue,
  sleepIntelligenceQueue,
  riskEscalationQueue,
  improvementDetectionQueue
};

// Import all workers to ensure they start processing
require('./healthScanWorker');
require('./medicinePatternWorker');
require('./sleepIntelligenceWorker');
require('./riskEscalationWorker');
require('./improvementDetectionWorker');

console.log('✅ [Living Health OS] All workers initialized and listening.');

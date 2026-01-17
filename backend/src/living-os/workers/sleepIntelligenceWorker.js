const createWorker = require('./workerFactory');
const { inferSleepFromActivity } = require('../intelligence/sleepIntelligence');
const User = require('../../../models/User');

const sleepIntelligenceWorker = createWorker('sleep-intelligence-queue', async (job) => {
  console.log(`🛌 [Sleep Intelligence] processing sleep data...`);
  
  if (job.name === 'analyze-sleep') {
     const users = await User.find({});
     for (const user of users) {
       const result = await inferSleepFromActivity(user._id);
       if (result.inferred) {
         console.log(`User ${user._id} sleep: ${result.durationHours.toFixed(1)}h`);
         // Save to DB: SleepLog model (to be created)
       }
     }
  }
});

module.exports = sleepIntelligenceWorker;

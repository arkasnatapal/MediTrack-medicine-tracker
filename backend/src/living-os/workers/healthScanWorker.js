const createWorker = require('./workerFactory');
const User = require('../../../models/User'); // Adjust path to models
const { determineHealthState, calculateHealthScore } = require('../intelligence/healthEngine');
const { inferSleepFromActivity } = require('../intelligence/sleepIntelligence');
const MedicineLog = require('../../../models/MedicineLog');

const healthScanWorker = createWorker('health-scan-queue', async (job) => {
  console.log(`🧠 [Health Scan] Processing daily scan for all users...`);
  
  // Ideally processing batches of users. 
  // For MVP/Demo, iterate all (careful with scale).
  // Or the job payload might contain 'userId' if we enqueue per user.
  // The plan said "Enqueue daily-health-scan (once per day)" -> This implies a single job triggering the scan?
  // Or we enqueue one job per user?
  // Distributed systems usually enqueue one job per user to fan-out.
  // For this implementations, let's assume the cron triggers "daily-scan-all" which then adds individual user jobs,
  // OR this worker itself iterates all users.
  // Let's go with: JOB='daily-scan-all' -> Iterate users and calculate.
  
  if (job.name === 'trigger-daily-scan') {
      const users = await User.find({});
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      for (const user of users) {
          // 1. Get Sleep Data
          const sleepData = await inferSleepFromActivity(user._id);
          
          // 2. Get Real Medicine Adherence
          const logs = await MedicineLog.find({
            userId: user._id,
            scheduledTime: { $gte: yesterday, $lte: endOfYesterday }
          });

          const total = logs.length;
          const taken = logs.filter(l => l.status === 'taken_on_time' || l.status === 'taken_late').length;
          const onTime = logs.filter(l => l.status === 'taken_on_time').length;
          
          const adherenceStats = { total, taken, onTime };
          
          // 3. Calculate
          // If no meds scheduled, assume perfect adherence (1.0) for scoring purposes
          const score = calculateHealthScore(adherenceStats, sleepData.inferred ? sleepData : { durationHours: 7 }); 
          const state = determineHealthState(score);
          
          console.log(`User ${user.email}: Score ${score} (${state}) [Meds: ${taken}/${total}]`);

          
          // 4. Update User (we need fields in User model or a separate HealthState model)
          // user.healthScore = score;
          // user.healthState = state;
          // await user.save();
      }
  }
});

module.exports = healthScanWorker;

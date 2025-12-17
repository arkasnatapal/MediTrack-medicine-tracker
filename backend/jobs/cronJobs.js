const cron = require('node-cron');
const { checkExpiredMedicines } = require('../utils/expiryChecker');

const startCronJobs = () => {
  // Run daily at 9 AM IST
  cron.schedule(process.env.CRON_SCHEDULE || '0 9 * * *', async () => {
    console.log('⏰ Running scheduled expiry check...');
    await checkExpiredMedicines();
  }, {
    timezone: process.env.TIMEZONE || 'Asia/Kolkata'
  });

  console.log('✅ Cron jobs initialized - Running daily at 9 AM IST');
};

module.exports = { startCronJobs };

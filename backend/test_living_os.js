require('dotenv').config();
const { 
  healthScanQueue, 
  sleepIntelligenceQueue, 
  riskEscalationQueue 
} = require('./src/living-os/queues');
const { connection } = require('./src/living-os/config/redis');

async function testLivingOS() {
  console.log('🧪 Starting Living Health OS Manual Test...');
  console.log('-------------------------------------------');

  try {
    // 1. Trigger Sleep Intelligence (normally runs first)
    console.log('SENDING: Sleep Intelligence Job...');
    await sleepIntelligenceQueue.add('analyze-sleep', { manual: true });
    console.log('✅ Sleep Intelligence Triggered');

    // 2. Trigger Health Scan
    console.log('SENDING: Health Scan Job...');
    await healthScanQueue.add('trigger-daily-scan', { manual: true });
    console.log('✅ Health Scan Triggered');

    // 3. Trigger Risk Check
    console.log('SENDING: Risk Escalation Job...');
    await riskEscalationQueue.add('check-risks', { manual: true });
    console.log('✅ Risk Check Triggered');

    console.log('-------------------------------------------');
    console.log('👉 Check your SERVER terminal logs to see workers processing these jobs!');
    console.log('   (You should see messages like "🧠 [Health Scan] Processing...")');
    
    // Allow some time for processing logging before exiting script
    // Note: The WORKERS are running in the main server process, so you must have 'npm start' running in another terminal.
    
    setTimeout(() => {
      console.log('👋 Test script finished. Exiting...');
      connection.quit(); // Close generic connection
      // We don't close queue connections here as it might hang, just process.exit
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

testLivingOS();

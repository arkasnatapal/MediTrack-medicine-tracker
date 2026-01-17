const { Worker } = require('bullmq');
const { connection } = require('../config/redis');

/**
 * Creates a new BullMQ Worker
 * @param {string} queueName 
 * @param {Function} processor 
 * @returns {Worker}
 */
const createWorker = (queueName, processor) => {
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: 5, // Process up to 5 jobs in parallel
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ [${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [${queueName}] Job ${job.id} failed: ${err.message}`);
  });

  return worker;
};

module.exports = createWorker;

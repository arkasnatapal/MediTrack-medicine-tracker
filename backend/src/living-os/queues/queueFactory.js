const { Queue } = require('bullmq');
const { connection } = require('../config/redis');

/**
 * Creates a new BullMQ Queue with standard configuration
 * @param {string} queueName 
 * @returns {Queue}
 */
const createQueue = (queueName) => {
  return new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep for 24 hours
        count: 100,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs longer for debugging
      },
    },
  });
};

module.exports = createQueue;

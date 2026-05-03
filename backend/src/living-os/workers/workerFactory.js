/**
 * Mock createWorker to remove BullMQ dependency
 * @param {string} queueName 
 * @param {Function} processor 
 * @returns {Object}
 */
const createWorker = (queueName, processor) => {
  console.log(`[Mock Worker: ${queueName}] Initialized.`);
  
  // Return an object that mimics the worker if needed, 
  // but also expose the processor for direct calls.
  return {
    name: queueName,
    process: async (data) => {
      console.log(`[Mock Worker: ${queueName}] Manually processing job...`);
      return await processor({ name: 'manual', data });
    },
    on: () => {}, // Mock event emitter
    close: async () => {}
  };
};

module.exports = createWorker;


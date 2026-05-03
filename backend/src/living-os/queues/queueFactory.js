/**
 * Mock createQueue to remove BullMQ dependency
 * Executes jobs immediately when added
 */
const createQueue = (queueName) => {
  return {
    name: queueName,
    add: async (jobName, data) => {
      console.log(`[Mock Queue: ${queueName}] Adding job: ${jobName}`);
      // In a real mock, we might want to find the worker and call it.
      // But for now, we'll just log it. The callers in cronRoutes will be updated to call workers directly.
      return { id: 'mock-id' };
    },
    close: async () => {}
  };
};

module.exports = createQueue;


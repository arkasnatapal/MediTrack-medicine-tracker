/**
 * External FHIR & ABDM Health Information Exchange Synchronization Abstraction.
 * Interoperates with external hospital FHIR servers when internet connectivity is available.
 */

const axios = require('axios');
const offlineQueueService = require('./offlineQueueService');

class SyncService {
  /**
   * Sync pending offline queued FHIR transactions with an external FHIR server / ABDM gateway.
   */
  async processSyncQueue(externalFhirServerUrl = null) {
    const queue = await offlineQueueService.getPendingQueue();
    if (queue.length === 0) {
      return { status: 'CLEARED', syncedCount: 0 };
    }

    let syncedCount = 0;
    const errors = [];

    for (const item of queue) {
      try {
        if (externalFhirServerUrl) {
          // Send HTTP POST to external FHIR endpoint
          await axios.post(`${externalFhirServerUrl}/${item.resourceType}`, item.payload, {
            headers: { 'Content-Type': 'application/fhir+json' },
            timeout: 5000
          });
        }
        await offlineQueueService.updateQueueStatus(item._id, 'SYNCED');
        syncedCount++;
      } catch (err) {
        errors.push(`Queue item ${item._id} sync failed: ${err.message}`);
        await offlineQueueService.updateQueueStatus(item._id, 'FAILED', err.message);
      }
    }

    return {
      status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
      syncedCount,
      remainingCount: queue.length - syncedCount,
      errors
    };
  }
}

module.exports = new SyncService();

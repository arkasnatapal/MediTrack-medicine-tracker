/**
 * Offline Synchronization Queue Manager for MediTrack.
 * Allows rural/offline deployments to queue FHIR transactions locally and sync when internet reconnects.
 */

const FhirSyncQueue = require('../../models/FhirSyncQueue');

class OfflineQueueService {
  /**
   * Queue a FHIR resource transaction when operating offline.
   */
  async enqueueAction({ resourceType, resourceId, action = 'CREATE', payload = {} }) {
    try {
      const queueItem = new FhirSyncQueue({
        resourceType,
        resourceId,
        action,
        payload,
        status: 'QUEUED',
        attempts: 0
      });
      await queueItem.save();
      return queueItem;
    } catch (err) {
      console.error('Error queueing offline FHIR action:', err.message);
      return null;
    }
  }

  /**
   * Fetch all pending queued items for sync.
   */
  async getPendingQueue() {
    try {
      return await FhirSyncQueue.find({ status: 'QUEUED' }).sort({ createdAt: 1 });
    } catch (err) {
      return [];
    }
  }

  /**
   * Mark a queued item as processed or failed.
   */
  async updateQueueStatus(queueId, status = 'SYNCED', error = null) {
    try {
      const item = await FhirSyncQueue.findById(queueId);
      if (item) {
        item.status = status;
        item.lastAttemptAt = new Date();
        if (error) item.lastError = String(error);
        if (status === 'FAILED') item.attempts += 1;
        await item.save();
      }
    } catch (err) {
      console.error('Error updating queue status:', err.message);
    }
  }
}

module.exports = new OfflineQueueService();

import cron from 'node-cron';
import outboxService from './outbox.service.js';
import teamsNotificationService from './teams.notification.service.js';
import storageService from '../storage/storage.service.js';

export class NotificationWorker {
  constructor() {
    this.isRunning = false;
    this.pollIntervalMs = 5000; // Poll every 5s for snappy notification delivery
    this.pollTimer = null;
    this.isProcessingBatch = false;
    this.stuckJobTask = null;
    this.orphanCleanupTask = null;
  }

  /**
   * Start worker polling loop and scheduled maintenance tasks
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀  Notification worker started.');

    // Main polling loop for outbox processing
    this.pollTimer = setInterval(() => {
      this.processOutboxBatch().catch((err) => {
        console.error('[NotificationWorker] Polling loop error:', err.message);
      });
    }, this.pollIntervalMs);

    // Maintenance cron 1: Recover stuck jobs every 5 minutes
    this.stuckJobTask = cron.schedule('*/5 * * * *', async () => {
      try {
        await outboxService.recoverStuckJobs(5);
      } catch (err) {
        console.error('[NotificationWorker] Stuck job recovery error:', err.message);
      }
    });

    // Maintenance cron 2: Clean up orphaned storage uploads once every hour
    this.orphanCleanupTask = cron.schedule('0 * * * *', async () => {
      try {
        await storageService.cleanupOrphanedUploads();
      } catch (err) {
        console.error('[NotificationWorker] Orphan cleanup error:', err.message);
      }
    });

    // Process immediately on startup
    this.processOutboxBatch().catch(() => {});
  }

  /**
   * Process one or more jobs pending in the outbox
   */
  async processOutboxBatch() {
    if (this.isProcessingBatch || !this.isRunning) return;
    this.isProcessingBatch = true;

    try {
      let job = await outboxService.claimNextJob();
      while (job && this.isRunning) {
        console.log(`[NotificationWorker] Processing job ${job._id} (type: ${job.notificationType})...`);
        try {
          if (job.notificationType === 'teams') {
            await teamsNotificationService.send(job.payload, job.destination);
            await outboxService.markSent(job._id);
            console.log(`[NotificationWorker] Job ${job._id} marked SENT.`);
          } else {
            console.warn(`[NotificationWorker] Unknown notificationType: ${job.notificationType}`);
            await outboxService.markSent(job._id);
          }
        } catch (jobErr) {
          console.error(`[NotificationWorker] Error dispatching job ${job._id}:`, jobErr.message);
          await outboxService.markFailedOrRetry(job._id, jobErr);
        }

        // Check if another job is waiting
        job = await outboxService.claimNextJob();
      }
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Graceful shutdown of worker
   */
  stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.stuckJobTask) {
      this.stuckJobTask.stop();
      this.stuckJobTask = null;
    }
    if (this.orphanCleanupTask) {
      this.orphanCleanupTask.stop();
      this.orphanCleanupTask = null;
    }
    console.log('🛑  Notification worker stopped.');
  }
}

const notificationWorker = new NotificationWorker();
export default notificationWorker;


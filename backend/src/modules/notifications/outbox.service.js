import Outbox from './outbox.model.js';
import {
  OUTBOX_STATUSES,
  NOTIFICATION_TYPES,
  RETRY_DELAYS_MS,
  MAX_RETRY_ATTEMPTS,
} from '../feedback/feedback.constants.js';

export class OutboxService {
  /**
   * Create an outbox entry inside an existing session/transaction
   */
  async createOutboxEntry(
    { feedbackId, notificationType = NOTIFICATION_TYPES.TEAMS, destination, payload },
    session = null
  ) {
    const docData = {
      feedbackId,
      notificationType,
      destination,
      payload,
      status: OUTBOX_STATUSES.PENDING,
      attempts: 0,
      nextRetryAt: new Date(),
    };

    const opts = session ? { session } : {};
    const [entry] = await Outbox.create([docData], opts);
    return entry;
  }

  /**
   * Atomically claims the next pending job ready for processing.
   * Multiple instances can poll safely without race conditions.
   */
  async claimNextJob() {
    const now = new Date();
    return Outbox.findOneAndUpdate(
      {
        status: OUTBOX_STATUSES.PENDING,
        nextRetryAt: { $lte: now },
      },
      {
        $set: {
          status: OUTBOX_STATUSES.PROCESSING,
          updatedAt: now,
        },
      },
      {
        sort: { nextRetryAt: 1 },
        new: true,
      }
    );
  }

  /**
   * Mark a claimed job as successfully sent
   */
  async markSent(jobId) {
    const now = new Date();
    return Outbox.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: OUTBOX_STATUSES.SENT,
          sentAt: now,
          lastError: null,
        },
      },
      { new: true }
    );
  }

  /**
   * Mark a claimed job as failed and schedule the next retry with exponential backoff,
   * or mark as permanently failed if max attempts reached.
   */
  async markFailedOrRetry(jobId, error) {
    const job = await Outbox.findById(jobId);
    if (!job) return null;

    const newAttempts = job.attempts + 1;
    const errorMessage = error?.message || String(error);

    if (newAttempts < MAX_RETRY_ATTEMPTS) {
      // Pick retry delay: index 0: 0s, index 1: 30s, index 2: 2m, index 3: 10m, index 4: 30m
      const delayMs = RETRY_DELAYS_MS[newAttempts] ?? 1_800_000;
      const nextRetry = new Date(Date.now() + delayMs);

      console.warn(
        `[OutboxService] Job ${jobId} failed (attempt ${newAttempts}/${MAX_RETRY_ATTEMPTS}). Retrying in ${delayMs / 1000}s at ${nextRetry.toISOString()}`
      );

      return Outbox.findByIdAndUpdate(
        jobId,
        {
          $set: {
            status: OUTBOX_STATUSES.PENDING,
            attempts: newAttempts,
            lastError: errorMessage,
            nextRetryAt: nextRetry,
          },
        },
        { new: true }
      );
    }

    // Permanently failed
    console.error(
      `[OutboxService] Job ${jobId} permanently failed after ${newAttempts} attempts: ${errorMessage}`
    );

    return Outbox.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: OUTBOX_STATUSES.FAILED,
          attempts: newAttempts,
          lastError: errorMessage,
        },
      },
      { new: true }
    );
  }

  /**
   * Recover jobs that were left in 'processing' status due to unexpected server crashes
   */
  async recoverStuckJobs(olderThanMinutes = 5) {
    const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const result = await Outbox.updateMany(
      {
        status: OUTBOX_STATUSES.PROCESSING,
        updatedAt: { $lte: threshold },
      },
      {
        $set: {
          status: OUTBOX_STATUSES.PENDING,
          nextRetryAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.warn(`[OutboxService] Recovered ${result.modifiedCount} stuck notification jobs.`);
    }

    return result.modifiedCount;
  }

  /**
   * Re-queue a failed notification job (Admin action)
   */
  async requeueFailedJob(jobId) {
    const job = await Outbox.findById(jobId);
    if (!job) {
      throw new Error('Notification outbox record not found');
    }

    job.status = OUTBOX_STATUSES.PENDING;
    job.attempts = 0;
    job.nextRetryAt = new Date();
    job.lastError = null;
    await job.save();

    console.log(`[OutboxService] Admin manually re-queued notification job ${jobId}`);
    return job;
  }
}

const outboxService = new OutboxService();
export default outboxService;

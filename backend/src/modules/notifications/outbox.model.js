import mongoose from 'mongoose';
import { NOTIFICATION_TYPES, OUTBOX_STATUSES } from '../feedback/feedback.constants.js';

const outboxSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: true,
    },
    notificationType: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    destination: {
      type: String,
      required: true, // webhook URL (truncated in logs)
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OUTBOX_STATUSES),
      default: OUTBOX_STATUSES.PENDING,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notification_outbox',
  }
);

// Compound index for worker polling
outboxSchema.index({ status: 1, nextRetryAt: 1 });
outboxSchema.index({ feedbackId: 1 });

const Outbox = mongoose.model('Outbox', outboxSchema);
export default Outbox;


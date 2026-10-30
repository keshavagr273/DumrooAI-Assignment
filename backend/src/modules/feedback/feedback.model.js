import mongoose from 'mongoose';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, STORAGE_PROVIDERS } from './feedback.constants.js';

const attachmentSchema = new mongoose.Schema(
  {
    storageProvider: {
      type: String,
      enum: Object.values(STORAGE_PROVIDERS),
      default: STORAGE_PROVIDERS.SUPABASE,
    },
    storageKey: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true, // bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    _id: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const contextSchema = new mongoose.Schema(
  {
    pageUrl: { type: String, maxlength: 2048 },
    pageTitle: { type: String, maxlength: 500 },
    browser: { type: String, maxlength: 200 },
    os: { type: String, maxlength: 200 },
    screenResolution: { type: String, maxlength: 50 },
    viewport: { type: String, maxlength: 50 },
    environment: { type: String, maxlength: 50 },
    timezone: { type: String, maxlength: 100 },
    timestamp: { type: Date },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    category: {
      type: String,
      enum: Object.values(FEEDBACK_CATEGORIES),
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: contextSchema,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(FEEDBACK_STATUSES),
      default: FEEDBACK_STATUSES.OPEN,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 attachments allowed per feedback report.',
      },
    },
  },
  {
    timestamps: true,
    collection: 'feedback_submissions',
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ organizationId: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ organizationId: 1, createdAt: -1 });
feedbackSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;


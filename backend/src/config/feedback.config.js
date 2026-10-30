import env from './env.js';

export const feedbackConfig = {
  maxAttachments: env.FEEDBACK_MAX_ATTACHMENTS,
  maxFileSizeMb: env.FEEDBACK_MAX_FILE_SIZE_MB,
  maxFileSizeBytes: env.FEEDBACK_MAX_FILE_SIZE_MB * 1024 * 1024,
  descriptionMinLength: env.FEEDBACK_DESCRIPTION_MIN_LENGTH,
  descriptionMaxLength: env.FEEDBACK_DESCRIPTION_MAX_LENGTH,
  signedUrlExpiresSeconds: env.FEEDBACK_SIGNED_URL_EXPIRES_SECONDS,
  uploadUrlExpiresSeconds: env.FEEDBACK_UPLOAD_URL_EXPIRES_SECONDS,
  orphanCleanupGraceMinutes: env.FEEDBACK_ORPHAN_CLEANUP_GRACE_MINUTES,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
  rateLimitWindowMs: env.FEEDBACK_RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.FEEDBACK_RATE_LIMIT_MAX_REQUESTS,
};

export default feedbackConfig;


export const FEEDBACK_CATEGORIES = Object.freeze({
  BUG: 'bug',
  UI_UX: 'ui_ux',
  FEATURE_REQUEST: 'feature_request',
  GENERAL: 'general',
  OTHER: 'other',
});

export const FEEDBACK_STATUSES = Object.freeze({
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

export const NOTIFICATION_TYPES = Object.freeze({
  TEAMS: 'teams',
});

export const OUTBOX_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  FAILED: 'failed',
});

export const STORAGE_PROVIDERS = Object.freeze({
  SUPABASE: 'supabase',
});

// Retry backoff delays in milliseconds
export const RETRY_DELAYS_MS = [0, 30_000, 120_000, 600_000, 1_800_000]; // 0s, 30s, 2m, 10m, 30m
export const MAX_RETRY_ATTEMPTS = 5;


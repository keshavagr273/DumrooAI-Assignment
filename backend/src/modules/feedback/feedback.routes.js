import { Router } from 'express';
import {
  requestUploadUrl,
  submitFeedback,
  getMyReports,
  getFeedbackById,
  updateStatus,
  retryNotification,
} from './feedback.controller.js';
import requireAuth from '../../middleware/auth.middleware.js';
import requireAdmin from '../../middleware/adminGuard.middleware.js';
import requireIdempotencyKey from '../../middleware/idempotency.middleware.js';
import {
  uploadRateLimiter,
  feedbackSubmitLimiter,
} from '../../middleware/rateLimiter.middleware.js';
import {
  validateUploadUrl,
  validateSubmitFeedback,
  validateStatusUpdate,
  validatePagination,
} from './feedback.validation.js';

const router = Router();

// 1. Request signed upload URL (authenticated + rate-limited + validated)
router.post(
  '/upload-url',
  requireAuth,
  uploadRateLimiter,
  validateUploadUrl,
  requestUploadUrl
);

// 2. Submit new feedback (authenticated + rate-limited + idempotency + validated)
router.post(
  '/',
  requireAuth,
  feedbackSubmitLimiter,
  requireIdempotencyKey,
  validateSubmitFeedback,
  submitFeedback
);

// 3. List my / org feedback reports (paginated)
router.get(
  '/my-reports',
  requireAuth,
  validatePagination,
  getMyReports
);

// 4. View specific report with attachment download URLs (access controlled)
router.get(
  '/:id',
  requireAuth,
  getFeedbackById
);

// 5. Update feedback status (internal admin only)
router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  validateStatusUpdate,
  updateStatus
);

// 6. Retry failed notification (internal admin only)
router.post(
  '/notifications/:id/retry',
  requireAuth,
  requireAdmin,
  retryNotification
);

export default router;


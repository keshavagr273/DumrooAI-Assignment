import rateLimit from 'express-rate-limit';
import feedbackConfig from '../config/feedback.config.js';

export const uploadRateLimiter = rateLimit({
  windowMs: feedbackConfig.rateLimitWindowMs,
  max: feedbackConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests. Please slow down and try again later.',
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
});

export const feedbackSubmitLimiter = rateLimit({
  windowMs: feedbackConfig.rateLimitWindowMs,
  max: feedbackConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many feedback submissions. Please slow down and try again later.',
  },
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
});


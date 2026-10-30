import { body, query, param, validationResult } from 'express-validator';
import path from 'node:path';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from './feedback.constants.js';
import feedbackConfig from '../../config/feedback.config.js';

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
}

export const validateUploadUrl = [
  body('originalFilename')
    .trim()
    .notEmpty()
    .withMessage('originalFilename is required')
    .isLength({ max: 255 })
    .withMessage('Filename is too long')
    .custom((val) => {
      const ext = path.extname(val).toLowerCase().replace('.', '');
      if (!feedbackConfig.allowedExtensions.includes(ext)) {
        throw new Error(`Invalid file extension .${ext}. Allowed: ${feedbackConfig.allowedExtensions.join(', ')}`);
      }
      return true;
    }),

  body('mimeType')
    .trim()
    .notEmpty()
    .withMessage('mimeType is required')
    .custom((val) => {
      if (!feedbackConfig.allowedMimeTypes.includes(val)) {
        throw new Error(`Invalid MIME type '${val}'. Allowed: ${feedbackConfig.allowedMimeTypes.join(', ')}`);
      }
      return true;
    }),

  body('fileSize')
    .isInt({ min: 1, max: feedbackConfig.maxFileSizeBytes })
    .withMessage(`File size must be between 1 byte and ${feedbackConfig.maxFileSizeMb} MB`),

  // Cross-validate extension matches MIME type
  body().custom((body) => {
    const ext = path.extname(body.originalFilename || '').toLowerCase().replace('.', '');
    const mime = body.mimeType;

    const mimeToExts = {
      'image/png': ['png'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/webp': ['webp'],
    };

    if (mime && ext && mimeToExts[mime] && !mimeToExts[mime].includes(ext)) {
      throw new Error(`MIME type '${mime}' does not match file extension .${ext}`);
    }
    return true;
  }),

  handleValidationErrors,
];

export const validateSubmitFeedback = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(FEEDBACK_CATEGORIES))
    .withMessage(`Invalid category. Allowed: ${Object.values(FEEDBACK_CATEGORIES).join(', ')}`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({
      min: feedbackConfig.descriptionMinLength,
      max: feedbackConfig.descriptionMaxLength,
    })
    .withMessage(
      `Description must be between ${feedbackConfig.descriptionMinLength} and ${feedbackConfig.descriptionMaxLength} characters`
    ),

  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),

  body('context.pageUrl')
    .optional()
    .isString()
    .isLength({ max: 2048 }),

  body('attachments')
    .optional()
    .isArray({ max: feedbackConfig.maxAttachments })
    .withMessage(`Maximum ${feedbackConfig.maxAttachments} attachments allowed`),

  body('attachments.*.storageKey')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('storageKey is required for each attachment')
    .matches(/^feedback\//)
    .withMessage('storageKey must be in valid feedback storage format'),

  body('attachments.*.originalFilename')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('originalFilename is required for each attachment'),

  body('attachments.*.mimeType')
    .optional()
    .isIn(feedbackConfig.allowedMimeTypes)
    .withMessage('Invalid attachment MIME type'),

  body('attachments.*.fileSize')
    .optional()
    .isInt({ min: 1, max: feedbackConfig.maxFileSizeBytes })
    .withMessage(`Attachment file size must be <= ${feedbackConfig.maxFileSizeMb} MB`),

  handleValidationErrors,
];

export const validateStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid feedback ID format'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(FEEDBACK_STATUSES))
    .withMessage(`Invalid status. Allowed: ${Object.values(FEEDBACK_STATUSES).join(', ')}`),

  handleValidationErrors,
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('category')
    .optional()
    .isIn(Object.values(FEEDBACK_CATEGORIES))
    .withMessage('Invalid category filter'),

  query('status')
    .optional()
    .isIn(Object.values(FEEDBACK_STATUSES))
    .withMessage('Invalid status filter'),

  handleValidationErrors,
];

import Feedback from './feedback.model.js';
import Counter from '../../counters/counter.model.js';

/**
 * Generate a human-readable reference ID in the format FB-YYYY-NNNNN.
 * Uses an atomic counter scoped to the current year.
 *
 * @param {import('mongoose').ClientSession} [session]
 */
export async function generateReferenceId(session = null) {
  const year = new Date().getFullYear();
  const key = `feedback-${year}`;
  const seq = await Counter.nextSeq(key, session);
  return `FB-${year}-${String(seq).padStart(5, '0')}`;
}

/**
 * Create a new feedback document inside an existing session.
 */
export async function createFeedback(data, session) {
  const referenceId = await generateReferenceId(session);
  const [doc] = await Feedback.create([{ ...data, referenceId }], { session });
  return doc;
}

/**
 * Find a feedback document by idempotency key for a specific user.
 * Used to detect and return duplicate submissions.
 */
export async function findByIdempotencyKey(userId, idempotencyKey) {
  return Feedback.findOne({ userId, idempotencyKey }).lean();
}

/**
 * Find a feedback document by ID, enforcing user/org access.
 */
export async function findByIdWithAccess(feedbackId, userId, organizationId, role = 'user') {
  const query = { _id: feedbackId };
  if (role === 'admin') {
    // System Admins can view any feedback report
    return Feedback.findOne(query);
  }
  if (organizationId) {
    // Org members can see all org feedback
    query.$or = [{ userId }, { organizationId }];
  } else {
    query.userId = userId;
  }
  return Feedback.findOne(query);
}

/**
 * Paginated list of feedback for a user / organization / admin.
 */
export async function listFeedback({ userId, organizationId, role = 'user', category, status, page = 1, limit = 20 }) {
  const filter = {};

  if (role === 'admin') {
    // Platform / System Admin sees ALL feedback submissions across all users and orgs
  } else if (organizationId) {
    filter.$or = [{ userId }, { organizationId }];
  } else {
    filter.userId = userId;
  }

  if (category) filter.category = category;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Feedback.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update feedback status (admin only).
 */
export async function updateStatus(feedbackId, status) {
  return Feedback.findByIdAndUpdate(feedbackId, { status }, { new: true });
}

/**
 * Verify that all storageKeys in the provided attachments list belong to
 * the authenticated user (key must contain their userId).
 */
export function verifyAttachmentOwnership(attachments, userId) {
  return attachments.every((att) => att.storageKey.includes(userId.toString()));
}


import mongoose from 'mongoose';
import storageService from '../storage/storage.service.js';
import outboxService from '../notifications/outbox.service.js';
import { buildTeamsAdaptiveCard } from '../notifications/teams.card.builder.js';
import {
  createFeedback,
  findByIdempotencyKey,
  findByIdWithAccess,
  listFeedback,
  updateStatus as repoUpdateStatus,
} from './feedback.repository.js';
import Feedback from './feedback.model.js';
import User from '../users/user.model.js';
import Organization from '../organizations/organization.model.js';
import env from '../../config/env.js';
import feedbackConfig from '../../config/feedback.config.js';

export class FeedbackService {
  /**
   * Request a signed upload URL for an attachment
   */
  async requestUploadUrl(user, { originalFilename, mimeType, fileSize }) {
    const result = await storageService.getSignedUploadUrl({
      organizationId: user.organizationId,
      userId: user.id,
      originalFilename,
      expiresIn: feedbackConfig.uploadUrlExpiresSeconds,
    });

    return result;
  }

  /**
   * Submit new feedback report atomically with notification outbox entry
   */
  async submitFeedback(user, feedbackData, idempotencyKey) {
    const userId = user.id || user._id;

    // 1. Idempotency Check
    const existing = await findByIdempotencyKey(userId, idempotencyKey);
    if (existing) {
      console.log(`[FeedbackService] Idempotent hit: returning existing feedback ${existing.referenceId}`);
      return {
        isDuplicate: true,
        feedback: {
          feedbackId: existing._id,
          referenceId: existing.referenceId,
          status: existing.status,
          category: existing.category,
          createdAt: existing.createdAt,
        },
      };
    }

    // 2. Validate attachment ownership
    const attachments = feedbackData.attachments || [];
    for (const att of attachments) {
      const isOwner = storageService.verifyKeyOwnership(att.storageKey, userId);
      if (!isOwner) {
        throw new Error(`Unauthorized attachment storage key: ${att.storageKey}`);
      }
    }

    // Prepare attachment documents
    const preparedAttachments = attachments.map((att) => ({
      storageProvider: 'supabase',
      storageKey: att.storageKey,
      originalFilename: att.originalFilename,
      mimeType: att.mimeType,
      fileSize: att.fileSize,
      uploadedBy: userId,
    }));

    // Fetch user & org display details for the Teams card
    const [userDoc, orgDoc] = await Promise.all([
      User.findById(userId).lean(),
      user.organizationId ? Organization.findById(user.organizationId).lean() : null,
    ]);

    // Check if MongoDB replica set / transactions are supported
    const isReplicaSet = Boolean(
      mongoose.connection?.client?.topology?.description?.type?.includes('ReplicaSet') ||
      mongoose.connection?.replicaSet
    );

    let session = null;
    let savedFeedback = null;

    try {
      if (isReplicaSet) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      // 3. Create Feedback Report
      const feedbackPayload = {
        userId,
        organizationId: user.organizationId || null,
        category: feedbackData.category,
        description: feedbackData.description.trim(),
        context: {
          ...feedbackData.context,
          timestamp: feedbackData.context?.timestamp ? new Date(feedbackData.context.timestamp) : new Date(),
        },
        idempotencyKey,
        attachments: preparedAttachments,
      };

      savedFeedback = await createFeedback(feedbackPayload, session);

      // 4. Generate signed download URLs for attachments to embed in Teams notification
      const signedUrls = [];
      for (const att of preparedAttachments) {
        const downloadUrl = await storageService.getSignedDownloadUrl(att.storageKey, 3600 * 24 * 7); // 7-day signed URL for support team
        signedUrls.push({
          filename: att.originalFilename,
          signedUrl: downloadUrl,
          fileSize: att.fileSize,
        });
      }

      // 5. Build Teams Adaptive Card payload
      const teamsPayload = buildTeamsAdaptiveCard(savedFeedback, signedUrls, {
        userName: userDoc?.name || user.name,
        userEmail: userDoc?.email || user.email,
        organizationName: orgDoc?.name || null,
      });

      // 6. Create Outbox entry atomically in the same transaction
      await outboxService.createOutboxEntry(
        {
          feedbackId: savedFeedback._id,
          notificationType: 'teams',
          destination: env.TEAMS_FEEDBACK_WEBHOOK_URL,
          payload: teamsPayload,
        },
        session
      );

      if (session) {
        await session.commitTransaction();
      }

      console.log(`[FeedbackService] Created feedback report ${savedFeedback.referenceId}`);

      return {
        isDuplicate: false,
        feedback: {
          feedbackId: savedFeedback._id,
          referenceId: savedFeedback.referenceId,
          status: savedFeedback.status,
          category: savedFeedback.category,
          createdAt: savedFeedback.createdAt,
        },
      };
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }

      // Attempt cleanup of newly uploaded attachments if submission aborted
      if (attachments.length > 0) {
        const keysToDelete = attachments.map((a) => a.storageKey);
        storageService.deleteFiles(keysToDelete).catch((cleanupErr) => {
          console.error('[FeedbackService] Cleanup failed storage keys error:', cleanupErr.message);
        });
      }

      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Get reports for the authenticated user/organization with signed download URLs
   */
  async getMyReports(user, query) {
    const userId = user.id || user._id;
    const organizationId = user.organizationId;
    const role = user.role || 'user';
    const { category, status, page = 1, limit = 20 } = query;

    const result = await listFeedback({
      userId,
      organizationId,
      role,
      category,
      status,
      page: Number(page),
      limit: Number(limit),
    });

    // Populate signed download URLs for attachments
    const enrichedItems = await Promise.all(
      result.items.map(async (item) => {
        const attachmentsWithUrls = await Promise.all(
          (item.attachments || []).map(async (att) => {
            const signedUrl = await storageService.getSignedDownloadUrl(att.storageKey);
            return {
              ...att,
              signedDownloadUrl: signedUrl,
            };
          })
        );
        return {
          ...item,
          attachments: attachmentsWithUrls,
        };
      })
    );

    return {
      ...result,
      items: enrichedItems,
    };
  }

  /**
   * Get feedback by ID with access control and signed download URLs
   */
  async getFeedbackById(user, feedbackId) {
    const userId = user.id || user._id;
    const organizationId = user.organizationId;
    const role = user.role || 'user';

    const feedback = await findByIdWithAccess(feedbackId, userId, organizationId, role);
    if (!feedback) {
      return null;
    }

    const doc = feedback.toObject();
    doc.attachments = await Promise.all(
      (doc.attachments || []).map(async (att) => ({
        ...att,
        signedDownloadUrl: await storageService.getSignedDownloadUrl(att.storageKey),
      }))
    );

    return doc;
  }

  /**
   * Update report status (admin only)
   */
  async updateStatus(feedbackId, status) {
    const updated = await repoUpdateStatus(feedbackId, status);
    if (!updated) {
      throw new Error('Feedback report not found');
    }
    return updated;
  }

  /**
   * Retry a failed notification outbox job (admin only)
   */
  async retryNotification(outboxId) {
    return outboxService.requeueFailedJob(outboxId);
  }
}

const feedbackService = new FeedbackService();
export default feedbackService;


import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import supabaseStorageProvider from './supabase.storage.js';
import feedbackConfig from '../../config/feedback.config.js';
import Feedback from '../feedback/feedback.model.js';

export class StorageService {
  constructor(provider = supabaseStorageProvider) {
    this.provider = provider;
  }

  /**
   * Generates a strict ownership-bound storage key:
   * feedback/{organizationId}/{userId}/{uuid}.{ext}
   */
  generateStorageKey(organizationId, userId, originalFilename) {
    const orgPart = organizationId ? organizationId.toString() : 'personal';
    const userPart = userId.toString();
    const ext = path.extname(originalFilename || '').toLowerCase().replace('.', '') || 'png';
    const uniqueId = uuidv4();
    return `feedback/${orgPart}/${userPart}/${uniqueId}.${ext}`;
  }

  /**
   * Verify that a given storage key strictly belongs to the specified userId
   */
  verifyKeyOwnership(storageKey, userId) {
    if (!storageKey || !userId) return false;
    const parts = storageKey.split('/');
    // Format: feedback / {orgId|personal} / {userId} / {uuid.ext}
    if (parts.length !== 4) return false;
    if (parts[0] !== 'feedback') return false;
    return parts[2] === userId.toString();
  }

  /**
   * Get a short-lived signed upload URL for an attachment
   */
  async getSignedUploadUrl({ organizationId, userId, originalFilename, expiresIn }) {
    const storageKey = this.generateStorageKey(organizationId, userId, originalFilename);
    const expiry = expiresIn || feedbackConfig.uploadUrlExpiresSeconds;
    const result = await this.provider.createSignedUploadUrl(storageKey, expiry);
    return {
      uploadUrl: result.uploadUrl,
      storageKey,
      expiresIn: expiry,
    };
  }

  /**
   * Get a signed download URL for reading an attachment
   */
  async getSignedDownloadUrl(storageKey, expiresIn) {
    const expiry = expiresIn || feedbackConfig.signedUrlExpiresSeconds;
    return this.provider.createSignedDownloadUrl(storageKey, expiry);
  }

  /**
   * Delete a file by storageKey
   */
  async deleteFile(storageKey) {
    return this.provider.deleteFile(storageKey);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(storageKeys) {
    return this.provider.deleteFiles(storageKeys);
  }

  /**
   * Scheduled job: Cleans up orphaned uploads not attached to any feedback report
   * after the configured grace period (e.g. 60 minutes)
   */
  async cleanupOrphanedUploads(graceMinutes = feedbackConfig.orphanCleanupGraceMinutes) {
    try {
      console.log(`[StorageService] Starting orphaned uploads cleanup (grace: ${graceMinutes}m)...`);
      const cutoff = new Date(Date.now() - graceMinutes * 60 * 1000);

      // List files in the bucket
      const files = await this.provider.listFiles('feedback');
      if (!files || files.length === 0) {
        console.log('[StorageService] No files found in feedback storage.');
        return { deletedCount: 0 };
      }

      const candidateKeys = [];
      for (const file of files) {
        if (file.createdAt < cutoff) {
          candidateKeys.push(file.name);
        }
      }

      if (candidateKeys.length === 0) {
        console.log('[StorageService] No expired candidate files found.');
        return { deletedCount: 0 };
      }

      // Check which of these are NOT in the Feedback collection
      const activeReports = await Feedback.find(
        { 'attachments.storageKey': { $in: candidateKeys } },
        { 'attachments.storageKey': 1 }
      ).lean();

      const activeKeySet = new Set();
      for (const report of activeReports) {
        for (const att of report.attachments || []) {
          activeKeySet.add(att.storageKey);
        }
      }

      const orphanedKeys = candidateKeys.filter((key) => !activeKeySet.has(key));
      if (orphanedKeys.length > 0) {
        console.log(`[StorageService] Deleting ${orphanedKeys.length} orphaned storage keys...`);
        await this.provider.deleteFiles(orphanedKeys);
      }

      console.log(`[StorageService] Orphaned cleanup completed. Removed: ${orphanedKeys.length}`);
      return { deletedCount: orphanedKeys.length, deletedKeys: orphanedKeys };
    } catch (err) {
      console.error('[StorageService] Orphan cleanup failed:', err.message);
      return { deletedCount: 0, error: err.message };
    }
  }
}

const storageService = new StorageService();
export default storageService;

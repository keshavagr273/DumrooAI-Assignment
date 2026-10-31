import { createClient } from '@supabase/supabase-js';
import { StorageInterface } from './storage.interface.js';
import env from '../../config/env.js';

export class SupabaseStorageProvider extends StorageInterface {
  constructor() {
    super();
    this.bucketName = env.SUPABASE_STORAGE_BUCKET || 'feedback-attachments';
    this.isConfigured = Boolean(
      env.SUPABASE_URL &&
      !env.SUPABASE_URL.includes('your-project') &&
      env.SUPABASE_SERVICE_ROLE_KEY &&
      !env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')
    );

    if (this.isConfigured) {
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } else {
      console.warn(
        '⚠️   Supabase Storage is running in fallback/development mode.\n' +
        '    Provide valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env for live cloud storage.'
      );
      this.client = null;
    }
  }

  /**
   * Generates a signed upload URL for the private bucket
   */
  async createSignedUploadUrl(storageKey, expiresIn = 300) {
    if (!this.isConfigured) {
      // Mock / Dev signed URL for testing when real Supabase is not configured yet
      return {
        uploadUrl: `https://mock-storage.local/${this.bucketName}/${storageKey}?token=dev-mock-upload-token&expires=${Date.now() + expiresIn * 1000}`,
        storageKey,
      };
    }

    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .createSignedUploadUrl(storageKey);

      if (error) {
        throw new Error(`Supabase createSignedUploadUrl error: ${error.message}`);
      }

      return {
        uploadUrl: data.signedUrl,
        storageKey,
        token: data.token,
      };
    } catch (err) {
      throw new Error(`Failed to generate signed upload URL: ${err.message}`);
    }
  }

  /**
   * Generates a short-lived signed download URL for private attachments
   */
  async createSignedDownloadUrl(storageKey, expiresIn = 3600) {
    if (!this.isConfigured) {
      return `https://mock-storage.local/${this.bucketName}/${storageKey}?token=dev-mock-download-token&expires=${Date.now() + expiresIn * 1000}`;
    }

    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .createSignedUrl(storageKey, expiresIn);

      if (error) {
        throw new Error(`Supabase createSignedUrl error: ${error.message}`);
      }

      return data.signedUrl;
    } catch (err) {
      console.error(`Failed to generate signed download URL for ${storageKey}:`, err.message);
      return null;
    }
  }

  /**
   * Delete a single file
   */
  async deleteFile(storageKey) {
    const deleted = await this.deleteFiles([storageKey]);
    return deleted.length > 0;
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(storageKeys) {
    if (!storageKeys || storageKeys.length === 0) return [];
    if (!this.isConfigured) {
      return storageKeys;
    }

    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .remove(storageKeys);

      if (error) {
        console.error('Supabase deleteFiles error:', error.message);
        return [];
      }

      return data ? data.map((f) => f.name) : storageKeys;
    } catch (err) {
      console.error('Failed to delete files from Supabase:', err.message);
      return [];
    }
  }

  /**
   * List files under a prefix
   */
  async listFiles(prefix = '') {
    if (!this.isConfigured) {
      return [];
    }

    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });

      if (error) {
        throw new Error(`Supabase listFiles error: ${error.message}`);
      }

      return (data || []).map((file) => ({
        id: file.id,
        name: file.name,
        createdAt: file.created_at ? new Date(file.created_at) : new Date(),
        metadata: file.metadata,
      }));
    } catch (err) {
      console.error('Failed to list files from Supabase:', err.message);
      return [];
    }
  }
}

const supabaseStorageProvider = new SupabaseStorageProvider();
export default supabaseStorageProvider;


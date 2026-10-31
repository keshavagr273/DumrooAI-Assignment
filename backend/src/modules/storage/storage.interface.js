/**
 * StorageService Interface
 * Defines standard contract for object storage operations (Supabase Storage, S3, R2, etc.)
 */
export class StorageInterface {
  /**
   * Create a short-lived signed upload URL for direct client upload
   * @param {string} storageKey - Path within the bucket
   * @param {number} expiresIn - Expiry in seconds
   * @returns {Promise<{ uploadUrl: string, storageKey: string }>}
   */
  async createSignedUploadUrl(storageKey, expiresIn) {
    throw new Error('createSignedUploadUrl must be implemented by storage provider');
  }

  /**
   * Create a short-lived signed download URL for viewing/downloading an attachment
   * @param {string} storageKey - Path within the bucket
   * @param {number} expiresIn - Expiry in seconds
   * @returns {Promise<string>}
   */
  async createSignedDownloadUrl(storageKey, expiresIn) {
    throw new Error('createSignedDownloadUrl must be implemented by storage provider');
  }

  /**
   * Delete a single file from storage
   * @param {string} storageKey - Path within the bucket
   * @returns {Promise<boolean>}
   */
  async deleteFile(storageKey) {
    throw new Error('deleteFile must be implemented by storage provider');
  }

  /**
   * Delete multiple files from storage
   * @param {string[]} storageKeys - Array of paths within the bucket
   * @returns {Promise<string[]>} Successfully deleted keys
   */
  async deleteFiles(storageKeys) {
    throw new Error('deleteFiles must be implemented by storage provider');
  }

  /**
   * List files in a prefix/path
   * @param {string} prefix
   * @returns {Promise<Array<{ name: string, createdAt: Date, id: string }>>}
   */
  async listFiles(prefix) {
    throw new Error('listFiles must be implemented by storage provider');
  }
}


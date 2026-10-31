import { describe, it, expect } from '@jest/globals';
import storageService from '../../modules/storage/storage.service.js';

describe('Unit: Storage Service Key & Ownership', () => {
  const userId = '60d5ec49f1b2c82b8c8f0001';
  const orgId = '60d5ec49f1b2c82b8c8f0002';

  it('should generate properly structured ownership-bound storage keys', () => {
    const key = storageService.generateStorageKey(orgId, userId, 'screenshot.png');
    expect(key).toMatch(new RegExp(`^feedback/${orgId}/${userId}/[a-f0-9-]+\\.png$`));
  });

  it('should fallback to personal when organizationId is null', () => {
    const key = storageService.generateStorageKey(null, userId, 'bug.jpeg');
    expect(key).toMatch(new RegExp(`^feedback/personal/${userId}/[a-f0-9-]+\\.jpeg$`));
  });

  it('should correctly verify key ownership for matching userId', () => {
    const key = storageService.generateStorageKey(orgId, userId, 'test.webp');
    const isOwner = storageService.verifyKeyOwnership(key, userId);
    expect(isOwner).toBe(true);
  });

  it('should reject key ownership when userId does not match', () => {
    const key = storageService.generateStorageKey(orgId, userId, 'test.webp');
    const isOwner = storageService.verifyKeyOwnership(key, 'different-user-id');
    expect(isOwner).toBe(false);
  });

  it('should reject invalid or malformed storage keys', () => {
    expect(storageService.verifyKeyOwnership('random-file.png', userId)).toBe(false);
    expect(storageService.verifyKeyOwnership('feedback/personal', userId)).toBe(false);
    expect(storageService.verifyKeyOwnership('', userId)).toBe(false);
  });
});


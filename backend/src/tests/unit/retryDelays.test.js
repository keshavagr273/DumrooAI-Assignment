import { describe, it, expect } from '@jest/globals';
import { RETRY_DELAYS_MS, MAX_RETRY_ATTEMPTS } from '../../modules/feedback/feedback.constants.js';

describe('Unit: Outbox Retry Configuration', () => {
  it('should have 5 exponential backoff intervals matching the spec', () => {
    expect(RETRY_DELAYS_MS).toEqual([
      0,          // immediate (attempt 0)
      30_000,     // 30 seconds
      120_000,    // 2 minutes
      600_000,    // 10 minutes
      1_800_000,  // 30 minutes
    ]);
    expect(MAX_RETRY_ATTEMPTS).toBe(5);
  });
});

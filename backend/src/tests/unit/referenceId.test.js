import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateReferenceId } from '../../modules/feedback/feedback.repository.js';
import Counter from '../../counters/counter.model.js';
import { setupTestDB, teardownTestDB } from '../testDb.js';

describe('Unit: Reference ID Generator', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    const year = new Date().getFullYear();
    await Counter.deleteOne({ _id: `feedback-${year}-test` }).catch(() => {});
    await teardownTestDB();
  });

  it('should generate a reference ID in FB-YYYY-NNNNN format', async () => {
    const refId = await generateReferenceId();
    const year = new Date().getFullYear();
    expect(refId).toMatch(new RegExp(`^FB-${year}-\\d{5}$`));
  });

  it('should monotonically increment the sequence', async () => {
    const refId1 = await generateReferenceId();
    const refId2 = await generateReferenceId();

    const seq1 = parseInt(refId1.split('-')[2], 10);
    const seq2 = parseInt(refId2.split('-')[2], 10);

    expect(seq2).toBe(seq1 + 1);
  });
});


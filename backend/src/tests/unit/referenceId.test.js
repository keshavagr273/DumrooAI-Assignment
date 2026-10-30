import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { generateReferenceId } from '../../modules/feedback/feedback.repository.js';
import Counter from '../../counters/counter.model.js';
import env from '../../config/env.js';
import '../../db/connection.js';

describe('Unit: Reference ID Generator', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Clean up test counters
    const year = new Date().getFullYear();
    await Counter.deleteOne({ _id: `feedback-${year}-test` });
    await mongoose.disconnect();
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

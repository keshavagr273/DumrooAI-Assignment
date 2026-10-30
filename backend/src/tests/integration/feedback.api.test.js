import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import app from '../../app.js';
import env from '../../config/env.js';
import User from '../../modules/users/user.model.js';
import Feedback from '../../modules/feedback/feedback.model.js';
import Outbox from '../../modules/notifications/outbox.model.js';
import '../../db/connection.js';

describe('Integration: Feedback API Endpoints', () => {
  let userToken = '';
  let adminToken = '';
  let testUserId = '';
  let createdFeedbackId = '';

  const testEmail = `testuser_${Date.now()}@example.com`;
  const adminEmail = `adminuser_${Date.now()}@example.com`;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Register a standard test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        name: 'Regular Test User',
        organizationName: 'Test Org',
        role: 'user',
      });

    userToken = userRes.body.data.token;
    testUserId = userRes.body.data.user.id;

    // Register an admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'AdminPassword123!',
        name: 'Admin Test User',
        organizationName: 'Test Org',
        role: 'admin',
      });

    adminToken = adminRes.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await Feedback.deleteMany({ userId: testUserId });
      await User.deleteMany({ email: { $in: [testEmail, adminEmail] } });
    }
    await mongoose.disconnect();
  });

  describe('Healthcheck', () => {
    it('GET /api/health returns 200 ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/feedback/upload-url', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/feedback/upload-url')
        .send({ originalFilename: 'screenshot.png', mimeType: 'image/png', fileSize: 1024 });

      expect(res.status).toBe(401);
    });

    it('should reject invalid MIME types', async () => {
      const res = await request(app)
        .post('/api/feedback/upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ originalFilename: 'script.exe', mimeType: 'application/x-msdownload', fileSize: 1024 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject file sizes exceeding 5MB', async () => {
      const res = await request(app)
        .post('/api/feedback/upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ originalFilename: 'huge.png', mimeType: 'image/png', fileSize: 6 * 1024 * 1024 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return a signed upload URL and ownership-bound key for valid requests', async () => {
      const res = await request(app)
        .post('/api/feedback/upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ originalFilename: 'valid-screen.png', mimeType: 'image/png', fileSize: 204800 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.storageKey).toContain(testUserId);
    });
  });

  describe('POST /api/feedback (Submission & Idempotency)', () => {
    const idempotencyKey = uuidv4();

    it('should reject submission without Idempotency-Key', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'bug',
          description: 'This is a detailed bug description for testing purposes.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Idempotency-Key');
    });

    it('should reject submission with description too short', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({
          category: 'bug',
          description: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject attachments not owned by the authenticated user', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({
          category: 'bug',
          description: 'This is a valid bug report with unauthorized attachment key.',
          attachments: [
            {
              storageKey: 'feedback/personal/someone-elses-id/file.png',
              originalFilename: 'file.png',
              mimeType: 'image/png',
              fileSize: 1024,
            },
          ],
        });

      expect(res.status).toBe(500); // Storage ownership check throws
    });

    it('should successfully submit valid feedback and create an outbox entry', async () => {
      // First get a valid signed storage key
      const uploadRes = await request(app)
        .post('/api/feedback/upload-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ originalFilename: 'issue.png', mimeType: 'image/png', fileSize: 50000 });

      const storageKey = uploadRes.body.data.storageKey;

      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          category: 'bug',
          description: 'The dashboard charts fail to render after filtering by date.',
          context: {
            pageUrl: 'https://app.example.com/dashboard',
            browser: 'Chrome 128',
            os: 'Windows 11',
          },
          attachments: [
            {
              storageKey,
              originalFilename: 'issue.png',
              mimeType: 'image/png',
              fileSize: 50000,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceId).toMatch(/^FB-\d{4}-\d{5}$/);
      expect(res.body.data.status).toBe('open');

      createdFeedbackId = res.body.data.feedbackId;

      // Verify outbox entry was created
      const outboxEntry = await Outbox.findOne({ feedbackId: createdFeedbackId });
      expect(outboxEntry).toBeDefined();
      expect(outboxEntry.notificationType).toBe('teams');
      expect(outboxEntry.status).toBe('pending');
    });

    it('should return the original result when submitted again with the same idempotency key', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey) // Same key!
        .send({
          category: 'bug',
          description: 'The dashboard charts fail to render after filtering by date.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedbackId).toBe(createdFeedbackId);
    });
  });

  describe('GET /api/feedback/my-reports', () => {
    it('should return paginated reports for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/feedback/my-reports?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('should return report details with signed download URLs', async () => {
      const res = await request(app)
        .get(`/api/feedback/${createdFeedbackId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdFeedbackId);
      expect(res.body.data.attachments[0].signedDownloadUrl).toBeDefined();
    });
  });

  describe('PATCH /api/feedback/:id/status (Admin access control)', () => {
    it('should forbid regular users from updating feedback status (403)', async () => {
      const res = await request(app)
        .patch(`/api/feedback/${createdFeedbackId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(403);
    });

    it('should allow admin users to update feedback status', async () => {
      const res = await request(app)
        .patch(`/api/feedback/${createdFeedbackId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('in_progress');
    });
  });
});

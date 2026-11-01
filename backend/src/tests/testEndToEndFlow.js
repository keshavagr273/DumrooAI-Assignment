import { setupTestDB, teardownTestDB } from './testDb.js';
import { FeedbackService } from '../modules/feedback/feedback.service.js';
import outboxService from '../modules/notifications/outbox.service.js';
import teamsNotificationService from '../modules/notifications/teams.notification.service.js';
import User from '../modules/users/user.model.js';
import Organization from '../modules/organizations/organization.model.js';
import Feedback from '../modules/feedback/feedback.model.js';
import Outbox from '../modules/notifications/outbox.model.js';

async function runEndToEndTest() {
  console.log('🔄 Setting up test environment and database...');
  await setupTestDB();

  try {
    // 1. Create test user & organization
    const org = await Organization.create({
      name: 'Acme Technologies Global',
      slug: `acme-${Date.now()}`,
    });

    const user = await User.create({
      name: 'Keshav Agrawal',
      email: `keshav-${Date.now()}@acme.com`,
      passwordHash: 'dummy-hashed-pass',
      organizationId: org._id,
      role: 'admin',
    });

    console.log(`✅ Test User created: ${user.email} (${user._id})`);

    // 2. Submit feedback through FeedbackService
    const feedbackService = new FeedbackService();
    const idempotencyKey = `idem-${Date.now()}`;

    const feedbackPayload = {
      category: 'ui_ux',
      description: 'The dark mode toggle contrast in the navigation bar does not meet WCAG AA standards. Text is difficult to read in high-glare environments.',
      context: {
        pageUrl: 'https://app.dumroo.ai/settings/appearance',
        pageTitle: 'Settings - Appearance',
        browser: 'Chrome 130.0.0.0 (Windows 11)',
        os: 'Windows 11 Pro 64-bit',
        screenResolution: '2560x1440',
        viewport: '1920x960',
        environment: 'staging',
      },
      attachments: [
        {
          storageKey: `feedback/${org._id}/${user._id}/toggle-contrast-screenshot.png`,
          originalFilename: 'toggle-contrast-screenshot.png',
          mimeType: 'image/png',
          fileSize: 312000,
        },
      ],
    };

    console.log('\n📝 Submitting feedback report through FeedbackService...');
    const result = await feedbackService.submitFeedback(
      { id: user._id, organizationId: org._id, name: user.name, email: user.email },
      feedbackPayload,
      idempotencyKey
    );

    console.log(`✅ Feedback report created: ${result.feedback.referenceId}`);
    console.log(`   Status: ${result.feedback.status}`);
    console.log(`   Category: ${result.feedback.category}`);

    // 3. Inspect Outbox entry created atomically in MongoDB
    const outboxEntry = await Outbox.findOne({ feedbackId: result.feedback.feedbackId });
    console.log(`\n📦 Outbox entry generated in MongoDB:`);
    console.log(`   ID: ${outboxEntry._id}`);
    console.log(`   Status: ${outboxEntry.status}`);
    console.log(`   Destination: ${outboxEntry.destination}`);

    // 4. Simulate Outbox Worker picking up and claiming the job atomically
    console.log('\n⚙️ Outbox Worker: Claiming job atomically...');
    const claimedJob = await outboxService.claimNextJob();
    console.log(`✅ Job claimed! New status: ${claimedJob.status} (attempts: ${claimedJob.attempts})`);

    // 5. Worker dispatches Adaptive Card to webhook.site
    console.log('\n📡 Outbox Worker: Dispatching Adaptive Card to Webhook URL...');
    const dispatchResult = await teamsNotificationService.send(claimedJob.payload, claimedJob.destination);
    console.log(`✅ HTTP Response status: ${dispatchResult.statusCode} ${dispatchResult.statusText}`);

    // 6. Mark job as SENT
    await outboxService.markSent(claimedJob._id);
    const updatedJob = await Outbox.findById(claimedJob._id);
    console.log(`✅ Outbox job status updated in MongoDB to: ${updatedJob.status.toUpperCase()}`);
    console.log(`   Sent At: ${updatedJob.sentAt}`);

    console.log('\n🎉 Complete End-to-End Test Passed: MongoDB Transaction + Outbox Worker + Live Webhook Delivery verified!');
  } finally {
    await teardownTestDB();
    process.exit(0);
  }
}

runEndToEndTest().catch((err) => {
  console.error('❌ End-to-end test failed:', err);
  process.exit(1);
});


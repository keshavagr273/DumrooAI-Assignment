import { buildTeamsAdaptiveCard } from '../modules/notifications/teams.card.builder.js';
import teamsNotificationService from '../modules/notifications/teams.notification.service.js';

async function testWebhook() {
  console.log('🚀 Testing Webhook.site delivery...\n');

  // Create sample feedback object
  const sampleFeedback = {
    referenceId: 'FB-2026-00042',
    category: 'bug',
    status: 'open',
    createdAt: new Date(),
    description: 'The authentication modal briefly flickers when clicking the Google SSO button on Firefox 128. Steps to reproduce: open in incognito, navigate to /login, click SSO.',
    context: {
      pageUrl: 'https://app.dumroo.ai/dashboard/billing',
      browser: 'Firefox 128.0 (64-bit)',
      os: 'Windows 11 Pro 23H2',
      screenResolution: '2560x1440',
      viewport: '1920x1080',
      environment: 'production',
    },
    userId: 'user_67253a99e4b01',
  };

  const sampleAttachments = [
    {
      filename: 'viewport-screenshot-2026-11-01.png',
      signedUrl: 'https://exeojqhhrujlbskcbfby.supabase.co/storage/v1/object/sign/feedback-attachments/feedback/org_demo/user_demo/uuid-screenshot.png?token=demo-token',
      fileSize: 428000,
    },
  ];

  const meta = {
    userName: 'Keshav Agrawal',
    userEmail: 'keshav@acme-corp.com',
    organizationName: 'Acme Technologies Global',
  };

  // Build the Adaptive Card
  const cardPayload = buildTeamsAdaptiveCard(sampleFeedback, sampleAttachments, meta);

  console.log('📦 Adaptive Card generated successfully:');
  console.log('   Type:', cardPayload.type);
  console.log('   Attachments:', cardPayload.attachments?.length);
  console.log('   Card Schema Version:', cardPayload.attachments?.[0]?.content?.version);

  // Dispatch through the Teams Notification Service
  console.log('\n📡 Dispatching to Webhook URL...');
  const result = await teamsNotificationService.send(cardPayload);

  console.log('\n📬 Delivery Result:');
  console.log('   Success:', result.success);
  console.log('   HTTP Status Code:', result.statusCode);
  console.log('   Status Text:', result.statusText);
  console.log('\n🎉 Webhook test completed successfully!');
}

testWebhook().catch((err) => {
  console.error('❌ Webhook test failed:', err);
  process.exit(1);
});


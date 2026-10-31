import { describe, it, expect } from '@jest/globals';
import { buildTeamsAdaptiveCard } from '../../modules/notifications/teams.card.builder.js';

describe('Unit: Teams Adaptive Card Builder', () => {
  const mockFeedback = {
    _id: '507f1f77bcf86cd799439011',
    referenceId: 'FB-2026-00042',
    category: 'bug',
    description: 'The checkout button <script>alert(1)</script> throws error 500.',
    status: 'open',
    createdAt: new Date('2026-03-15T12:00:00Z'),
    context: {
      pageUrl: 'https://app.example.com/checkout',
      browser: 'Chrome 128.0',
      os: 'Windows 11',
      screenResolution: '1920x1080',
    },
  };

  const mockAttachments = [
    {
      filename: 'error.png',
      signedUrl: 'https://storage.example.com/signed/error.png?token=xyz',
      fileSize: 102400,
    },
  ];

  it('should build a valid Adaptive Card 1.4 schema structure', () => {
    const card = buildTeamsAdaptiveCard(mockFeedback, mockAttachments, {
      userName: 'Alice Smith',
      userEmail: 'alice@example.com',
      organizationName: 'Acme Corp',
    });

    expect(card.type).toBe('message');
    expect(card.attachments).toBeDefined();
    expect(card.attachments[0].contentType).toBe('application/vnd.microsoft.card.adaptive');

    const content = card.attachments[0].content;
    expect(content.type).toBe('AdaptiveCard');
    expect(content.version).toBe('1.4');
    expect(content.body).toBeInstanceOf(Array);
  });

  it('should sanitize HTML tags from the user description', () => {
    const card = buildTeamsAdaptiveCard(mockFeedback, [], {});
    const content = card.attachments[0].content;

    // Find the text block for description
    const descBlock = content.body.find(
      (b) => b.type === 'TextBlock' && b.text && b.text.includes('checkout button')
    );

    expect(descBlock).toBeDefined();
    expect(descBlock.text).not.toContain('<script>');
    expect(descBlock.text).not.toContain('</script>');
    expect(descBlock.text).toContain('The checkout button alert(1) throws error 500.');
  });

  it('should include signed attachment links in actions', () => {
    const card = buildTeamsAdaptiveCard(mockFeedback, mockAttachments, {});
    const content = card.attachments[0].content;

    expect(content.actions).toBeDefined();
    const screenshotAction = content.actions.find((a) => a.title.includes('View Screenshot'));
    expect(screenshotAction).toBeDefined();
    expect(screenshotAction.url).toBe(mockAttachments[0].signedUrl);
  });
});


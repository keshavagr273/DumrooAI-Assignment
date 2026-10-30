/**
 * Sanitizes text to prevent injection or invalid formatting in Teams Adaptive Cards
 */
function sanitizeText(str) {
  if (!str) return 'N/A';
  return String(str)
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
    .trim();
}

/**
 * Maps category to accent styling and human label
 */
function getCategoryMeta(category) {
  const map = {
    bug: { label: 'Bug Report', color: 'Attention', emoji: '🐞' },
    ui_ux: { label: 'UI / UX Issue', color: 'Accent', emoji: '🎨' },
    feature_request: { label: 'Feature Request', color: 'Good', emoji: '💡' },
    general: { label: 'General Feedback', color: 'Warning', emoji: '💬' },
    other: { label: 'Other Feedback', color: 'Default', emoji: '📌' },
  };
  return map[category] || { label: category || 'Feedback', color: 'Default', emoji: '📝' };
}

/**
 * Builds an Adaptive Card v1.4 payload compatible with Power Automate / MS Teams Workflows
 * @param {Object} feedback - Feedback document
 * @param {Array<{ filename: string, signedUrl: string, fileSize: number }>} attachmentUrls - Signed download URLs
 * @param {Object} [meta] - User/Org display details
 */
export function buildTeamsAdaptiveCard(feedback, attachmentUrls = [], meta = {}) {
  const catMeta = getCategoryMeta(feedback.category);
  const submittedBy = meta.userName ? `${meta.userName} (${meta.userEmail || 'N/A'})` : feedback.userId?.toString() || 'Anonymous';
  const orgName = meta.organizationName || 'Personal / None';
  const timestamp = feedback.createdAt ? new Date(feedback.createdAt).toUTCString() : new Date().toUTCString();
  const context = feedback.context || {};

  const facts = [
    { title: 'Reference ID', value: feedback.referenceId },
    { title: 'Category', value: `${catMeta.emoji} ${catMeta.label}` },
    { title: 'Status', value: (feedback.status || 'open').toUpperCase() },
    { title: 'Submitted By', value: sanitizeText(submittedBy) },
    { title: 'Organization', value: sanitizeText(orgName) },
    { title: 'Timestamp (UTC)', value: timestamp },
    { title: 'Page URL', value: sanitizeText(context.pageUrl || 'N/A') },
    { title: 'Browser', value: sanitizeText(context.browser || 'Unknown') },
    { title: 'Operating System', value: sanitizeText(context.os || 'Unknown') },
  ];

  if (context.screenResolution) {
    facts.push({ title: 'Resolution', value: sanitizeText(context.screenResolution) });
  }

  // Build attachment actions / links
  const actions = [];
  if (context.pageUrl && context.pageUrl.startsWith('http')) {
    actions.push({
      type: 'Action.OpenUrl',
      title: '🔗 Open Reported Page',
      url: context.pageUrl,
    });
  }

  // Attachment elements for the card body
  const attachmentElements = [];
  if (attachmentUrls && attachmentUrls.length > 0) {
    attachmentElements.push({
      type: 'TextBlock',
      text: `**Attachments (${attachmentUrls.length}):**`,
      wrap: true,
      spacing: 'Medium',
      weight: 'Bolder',
    });

    const attachmentFacts = attachmentUrls.map((att, idx) => ({
      title: `Screenshot ${idx + 1}`,
      value: `[${sanitizeText(att.filename || 'View Screenshot')}](${att.signedUrl})`,
    }));

    attachmentElements.push({
      type: 'FactSet',
      facts: attachmentFacts,
    });

    // Add buttons for opening screenshots
    attachmentUrls.forEach((att, idx) => {
      if (att.signedUrl) {
        actions.push({
          type: 'Action.OpenUrl',
          title: `🖼️ View Screenshot ${idx + 1}`,
          url: att.signedUrl,
        });
      }
    });
  }

  const card = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'Container',
              style: 'emphasis',
              bleed: true,
              items: [
                {
                  type: 'TextBlock',
                  text: 'New Customer Feedback Received',
                  weight: 'Bolder',
                  size: 'Large',
                  color: catMeta.color,
                },
                {
                  type: 'TextBlock',
                  text: `Ref: ${feedback.referenceId} • ${catMeta.label}`,
                  isSubtle: true,
                  spacing: 'None',
                },
              ],
            },
            {
              type: 'FactSet',
              facts,
              spacing: 'Medium',
            },
            {
              type: 'TextBlock',
              text: '**Description:**',
              weight: 'Bolder',
              spacing: 'Medium',
            },
            {
              type: 'TextBlock',
              text: sanitizeText(feedback.description),
              wrap: true,
              spacing: 'Small',
            },
            ...attachmentElements,
          ],
          actions: actions.length > 0 ? actions : undefined,
        },
      },
    ],
  };

  return card;
}

export default buildTeamsAdaptiveCard;

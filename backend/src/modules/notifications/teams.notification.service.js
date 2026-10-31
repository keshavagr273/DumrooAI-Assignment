import env from '../../config/env.js';

export class TeamsNotificationService {
  constructor(webhookUrl = env.TEAMS_FEEDBACK_WEBHOOK_URL) {
    this.defaultWebhookUrl = webhookUrl;
  }

  /**
   * Safely mask webhook URL for logging
   */
  maskWebhookUrl(url) {
    if (!url) return 'undefined';
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname.substring(0, 15)}...[masked]`;
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * Send Adaptive Card payload to Teams Power Automate webhook
   * @param {Object} payload - Teams Adaptive Card JSON
   * @param {string} [destination] - Webhook URL (falls back to default)
   */
  async send(payload, destination = this.defaultWebhookUrl) {
    const targetUrl = destination || this.defaultWebhookUrl;
    const maskedUrl = this.maskWebhookUrl(targetUrl);

    if (!targetUrl || targetUrl.includes('your-workflow-url')) {
      console.warn(`[TeamsService] Mocking Teams send — placeholder webhook URL: ${maskedUrl}`);
      return {
        success: true,
        statusCode: 202,
        statusText: 'Accepted (Dev Mock)',
        body: 'Mocked successful delivery for development environment',
      };
    }

    try {
      console.log(`[TeamsService] Posting Adaptive Card to ${maskedUrl}...`);
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000), // 15-second timeout
      });

      const responseText = await response.text();

      // Power Automate / Workflows HTTP triggers return 200 or 202
      if (response.ok) {
        console.log(`[TeamsService] Successfully delivered to Teams (${response.status})`);
        return {
          success: true,
          statusCode: response.status,
          statusText: response.statusText,
          body: responseText,
        };
      }

      console.error(`[TeamsService] Delivery failed with status ${response.status}: ${responseText}`);
      throw new Error(`Teams webhook error (${response.status}): ${responseText.slice(0, 300)}`);
    } catch (err) {
      console.error(`[TeamsService] Webhook network error: ${err.message}`);
      throw err;
    }
  }
}

const teamsNotificationService = new TeamsNotificationService();
export default teamsNotificationService;


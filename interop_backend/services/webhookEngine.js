const crypto = require('crypto');
const axios = require('axios');
const InteropWebhookSubscription = require('../models/WebhookSubscription');
const InteropWebhookDeliveryLog = require('../models/WebhookDeliveryLog');

/**
 * Dispatches real-time webhooks with HMAC-SHA256 signature to registered organization subscribers.
 */
async function dispatchWebhookEvent(organizationId, eventName, payload) {
  try {
    const subscriptions = await InteropWebhookSubscription.find({
      organizationId: organizationId,
      events: eventName,
      active: true
    });

    if (!subscriptions || subscriptions.length === 0) return;

    const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const eventPayload = {
      id: eventId,
      event: eventName,
      timestamp: new Date().toISOString(),
      organizationId,
      data: payload
    };

    const payloadString = JSON.stringify(eventPayload);

    for (const sub of subscriptions) {
      const hmac = crypto.createHmac('sha256', sub.secret);
      const signature = 'sha256=' + hmac.update(payloadString).digest('hex');

      const startTime = Date.now();
      let statusCode = 0;
      let success = false;
      let errorMsg = null;

      try {
        const response = await axios.post(sub.url, eventPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-MediTrack-Signature': signature,
            'X-Event-ID': eventId
          },
          timeout: 5000
        });
        statusCode = response.status;
        success = response.status >= 200 && response.status < 300;
      } catch (err) {
        statusCode = err.response ? err.response.status : 500;
        errorMsg = err.message;
      }

      const latencyMs = Date.now() - startTime;

      await InteropWebhookDeliveryLog.create({
        subscriptionId: sub._id,
        organizationId,
        event: eventName,
        eventId,
        targetUrl: sub.url,
        payload: eventPayload,
        statusCode,
        success,
        error: errorMsg,
        attempt: 1,
        latencyMs
      });
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err.message);
  }
}

module.exports = {
  dispatchWebhookEvent
};

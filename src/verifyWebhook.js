const config = require('../config.json');
const {verifyRequestSignature} = require('@slack/events-api');

/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} req Cloud Function request object.
 * @param {string} req.headers Headers Slack SDK uses to authenticate request.
 * @param {string} req.rawBody Raw body of webhook request to check signature against.
 */
const verifyWebhook = req => {
  const signature = {
    signingSecret: config.SLACK_SECRET,
    requestSignature: req.headers['x-slack-signature'],
    requestTimestamp: req.headers['x-slack-request-timestamp'],
    body: req.rawBody,
  };

  if (!verifyRequestSignature(signature)) {
    const error = new Error('Invalid credentials');
    error.code = 401;
    throw error;
  }
};

module.exports = verifyWebhook;

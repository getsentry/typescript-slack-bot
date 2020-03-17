import {verifyRequestSignature} from '@slack/events-api';

import {RequestError} from './error';

/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} req Cloud Function request object.
 * @param {string} req.headers Headers Slack SDK uses to authenticate request.
 * @param {string} req.rawBody Raw body of webhook request to check signature against.
 */
const verifyWebhook = req => {
  if (!process.env.SLACK_SECRET) {
    throw new RequestError('Missing `SLACK_SECRET`', 400);
  }

  const signature = {
    signingSecret: process.env.SLACK_SECRET,
    requestSignature: req.headers['x-slack-signature'],
    requestTimestamp: req.headers['x-slack-request-timestamp'],
    body: req.rawBody,
  };

  if (!verifyRequestSignature(signature)) {
    const error = new RequestError('Invalid credentials', 401);
    throw error;
  }
};

export default verifyWebhook;

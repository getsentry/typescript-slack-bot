import * as express from 'express';
import axios from 'axios';
import qs from 'querystring';

import {RequestError} from './error';
import getProgress from './getProgress';
import verifyWebhook from './verifyWebhook';

/**
 * Events API
 *
 * Trigger this function by creating a Slack slash command with this URL:
 * https://[YOUR_REGION].[YOUR_PROJECT_ID].cloudfunctions.net/events
 *
 * @param {object} req Cloud Function request object.
 * @param {object} req.body The request payload.
 * @param {string} req.rawBody Raw request payload used to validate Slack's message signature.
 * @param {string} req.body.text The user's search query.
 * @param {object} res Cloud Function response object.
 */
exports.events = async (req: express.Request, res: express.Response) => {
  try {
    if (req.body.challenge) {
      res.send(req.body.challenge);
      return;
    }

    if (req.method !== 'POST') {
      const error = new RequestError('Only POST requests are accepted', 405);
      throw error;
    }

    // Verify that this request came from Slack
    verifyWebhook(req);

    let payload = req.body;

    if (payload.event.type === 'app_mention') {
      if (payload.event.text.includes('status')) {
        // We need to respond asap so that slack doesn't retry
        res.status(200).send('OK');

        try {
          const [message, progressResp] = await Promise.all([
            axios.post(
              'https://slack.com/api/chat.postMessage',
              qs.stringify({
                token: process.env.SLACK_ACCESS_TOKEN,
                channel: payload.event.channel,
                as_user: false,
                text: '⏱  fetching status ...',
                blocks: JSON.stringify([
                  {
                    type: 'context',
                    elements: [
                      {
                        type: 'mrkdwn',
                        text: '⏱  fetching status ...',
                      },
                    ],
                  },
                ]),
              })
            ),
            getProgress(),
          ]);

          const {progress, remainingFiles} = progressResp;

          await axios.post(
            'https://slack.com/api/chat.update',
            qs.stringify({
              token: process.env.SLACK_ACCESS_TOKEN,
              channel: message.data.channel,
              ts: message.data.ts,
              as_user: false,
              blocks: JSON.stringify([
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `TypeScript progress: *${progress}%* completed, *${remainingFiles}* files remaining`,
                  },
                },
              ]),
            })
          );
        } catch (err) {
          console.error('sendConfirmation error: %o', err);
          const error = new RequestError('Error sending message to slack', 500);
          throw error;
        }
      }
    }
    return Promise.resolve();
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).send(err);
    return Promise.reject(err);
  }
};

exports.stats = async (req: express.Request, res: express.Response) => {
  try {
    const data = await getProgress();
    res.send(JSON.stringify(data));
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};

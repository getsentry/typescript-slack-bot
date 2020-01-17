const axios = require('axios');
const qs = require('querystring');

const config = require('./config.json');
const getProgress = require('./src/progress');
const verifyWebhook = require('./src/verifyWebhook');

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
exports.events = async (req, res) => {
  try {
    if (req.body.challenge) {
      res.send(req.body.challenge);
      return;
    }

    if (req.method !== 'POST') {
      const error = new Error('Only POST requests are accepted');
      error.code = 405;
      throw error;
    }

    // Verify that this request came from Slack
    verifyWebhook(req);

    let payload = req.body;

    if (payload.event.type === 'app_mention') {
      if (payload.event.text.includes('status')) {
        const {progress, remainingFiles} = await getProgress();

        try {
          const result = await axios.post(
            'https://slack.com/api/chat.postMessage',
            qs.stringify({
              token: config.SLACK_ACCESS_TOKEN,
              channel: payload.event.channel,
              as_user: false,
              text: `TypeScript progress: ${progress}% completed, ${remainingFiles} files remaining`,
            })
          );
          console.log('sendConfirmation: %o', result.data);
        } catch (err) {
          console.error('sendConfirmation error: %o', err);
          const error = new Error('Error sending message to slack');
          error.code = 500;
          throw error;
        }
      }
    }
    res.status(200).send('OK');
    return Promise.resolve();
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).send(err);
    return Promise.reject(err);
  }
};

exports.test = async (req, res) => {
  try {
    const {progress} = await progress();
    res.send(`${progress}%`);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
};

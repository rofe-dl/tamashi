require('dotenv').config({ path: 'config.env' });
const { logError } = require('../../utils/errorlogger');
const axios = require('axios');
const qs = require('querystring');

const URL = 'https://accounts.spotify.com/api';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

module.exports.authorizeBot = async () => {
  const authToken = Buffer.from(
    `${CLIENT_ID}:${CLIENT_SECRET}`,
    'utf-8'
  ).toString('base64');

  const data = qs.stringify({ grant_type: 'client_credentials' });

  try {
    const { data: response } = await axios.post(`${URL}/token`, data, {
      headers: {
        Authorization: 'Basic ' + authToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response;
  } catch (error) {
    logError(error);
  }
};

module.exports.authorizeUser = async () => {};

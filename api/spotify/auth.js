require('dotenv').config({ path: 'config.env' });
const axios = require('axios');
const qs = require('querystring');
const { generateRandomString } = require('../../utils/random');

const URL = 'https://accounts.spotify.com';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

function getAuthToken() {
  return Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`, 'utf-8').toString(
    'base64'
  );
}

function getHeaders() {
  return {
    Authorization: 'Basic ' + getAuthToken(),
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

module.exports.authorizeBot = async () => {
  const data = qs.stringify({ grant_type: 'client_credentials' });

  const { data: response } = await axios.post(`${URL}/api/token`, data, {
    headers: getHeaders(),
  });

  return response;
};

module.exports.userAuthorizeBot = async (userHandle) => {
  const SCOPE =
    'user-read-currently-playing user-read-playback-state user-modify-playback-state user-read-playback-position playlist-read-collaborative playlist-read-private';
  const redirect_uri =
    process.env.NODE_ENV === 'dev'
      ? process.env.SPOTIFY_REDIRECT_URI_DEV
      : process.env.SPOTIFY_REDIRECT_URI;
  const data = qs.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri,
    state: userHandle + '-' + generateRandomString(16),
    scope: SCOPE,
    // doesnt show the prompt if already authorized, direct callback
    show_dialog: true,
  });

  return `${URL}/authorize?${data}`;
};

module.exports.authorizeUser = async (userHandle, code) => {
  const redirect_uri =
    process.env.NODE_ENV === 'dev'
      ? process.env.SPOTIFY_REDIRECT_URI_DEV
      : process.env.SPOTIFY_REDIRECT_URI;

  const data = qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
  });

  const { data: response } = await axios.post(`${URL}/api/token`, data, {
    headers: getHeaders(),
  });

  return response;
};

module.exports.reAuthorizeUser = async (refreshToken) => {
  const data = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { data: response } = await axios.post(`${URL}/api/token`, data, {
    headers: getHeaders(),
  });

  return response;
};

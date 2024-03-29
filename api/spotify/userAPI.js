require('dotenv').config({ path: 'config.env' });
const axios = require('axios');
const { logError } = require('../../utils/logger');
const auth = require('./auth');

const URL = 'https://api.spotify.com/v1';

module.exports.UserAPI = {
  async regenerateToken(refreshToken) {
    const { access_token: accessToken } = await auth.reAuthorizeUser(
      refreshToken
    );
    return accessToken;
  },

  async getCurrentlyPlaying(oAuthToken, refreshToken) {
    const playingURL = `${URL}/me/player/currently-playing`;
    const options = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${oAuthToken}`,
      },
    };

    let response;

    try {
      response = await axios.get(playingURL, options);
    } catch (error) {
      try {
        if (error?.response?.status !== 200) {
          oAuthToken = await this.regenerateToken(refreshToken);
          options.headers.Authorization = `Bearer ${oAuthToken}`;

          response = await axios.get(playingURL, options);
        }
      } catch (error) {
        logError(error);
      }
    }

    // returns song url and also the oAuthToken in case it was refreshed
    return {
      trackURL: response?.data?.item?.external_urls?.spotify,
      oAuthToken,
      isPaused: response?.data?.is_playing === true ? 'false' : 'true',
    };
  },
};

require('dotenv').config({ path: 'config.env' });
const auth = require('./auth');
const { logError } = require('../../utils/errorlogger');
const axios = require('axios');
const datetime = new Date();

const URL = 'https://api.spotify.com/v1';

module.exports.SpotifyBotAPI = {
  token: 'NONE',

  async generateToken() {
    console.log('Generating Spotify token for bot...');
    const response = await auth.authorizeBot();
    this.token = response.access_token;
    console.log(
      'Generated at ' +
        datetime.toTimeString() +
        ' on ' +
        datetime.toDateString() +
        '!...'
    );
  },

  async getSpotifyLink(phrase) {
    const searchURL = `${URL}/search`;
    const options = {
      params: {
        q: phrase,
        type: 'track',
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    };

    let response;

    try {
      response = await axios.get(searchURL, options);
    } catch (error) {
      if (error?.response?.status === 401) {
        await this.generateToken();
        options.headers['Authorization'] = `Bearer ${this.token}`;
        response = await axios.get(searchURL, options);
      }
    }

    data = response.data;
    return data?.tracks?.items[0]?.external_urls?.spotify;
  },
};

require('dotenv').config({ path: 'config.env' });
const auth = require('./auth');
const { logError } = require('../../utils/errorlogger');
const axios = require('axios');
const datetime = new Date();

const URL = 'https://api.spotify.com/v1';

module.exports = {};

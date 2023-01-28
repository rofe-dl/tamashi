const app = require('express')();
require('dotenv').config({ path: 'config.env' });
const { authorizeUser } = require('../api/spotify/auth');

app.get('/tamashi/callback', async (req, res, next) => {
  const { code, state } = req.query;
  const userHandle = state.split('-')[0];

  await authorizeUser(userHandle, code);

  //todo make a pretty page here idk
  res.json('Successfully authorized Spotify! You may close this tab now :D');
});

app.get('/', (req, res) => {
  res.json('testing ngrok');
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on port ${process.env.SERVER_PORT}...`);
});

const app = require('express')();
require('dotenv').config({ path: 'config.env' });
const { authorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');

app.get('/tamashi/callback', async (req, res, next) => {
  // todo verify state
  const { code, state } = req.query;
  const userHandle = state.split('-')[0];

  try {
    const response = await authorizeUser(userHandle, code);
    await UserServices.deleteUser(userHandle);
    await UserServices.addUser(userHandle, response.refresh_token);

    //todo make a pretty page here idk
    res.json(
      'Successfully authorized Spotify! You may close this tab now and try the command again.'
    );
  } catch {
    res.json(
      'Authorization was unsuccessful due to an internal error. Please contact the developer to find out why.'
    );
  }
});

app.get('/', (req, res) => {
  res.json('Testing ngrok');
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on port ${process.env.SERVER_PORT}...`);
});

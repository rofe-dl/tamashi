import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import SpotifyWebApi from 'spotify-web-api-node';
import { storeRefreshToken } from 'db';
import { ngrokURL, spotify, NODE_ENV, serverURL } from './config.json';
import logger from './utils/logger';

const client_id = spotify.clientId;
const client_secret = spotify.clientSecret;
const redirect_uri =
  NODE_ENV === 'production'
    ? serverURL + '/tamashi/callback'
    : ngrokURL + '/tamashi/callback';

const stateKey = 'spotify_auth_state';
const app = express();
app.use(cookieParser());

const spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri,
});

const generateRandomString = (length: number): string => {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
};

app.get('/tamashi/login', (req, res, next) => {
  const state = generateRandomString(16);
  const { userId } = req.query;

  if (!userId) return next(new Error('User ID not found from query parameters'));

  res.cookie(stateKey, state);
  res.cookie('userId', userId);

  const authorizeURL = spotifyApi.createAuthorizeURL(
    [
      'user-read-private',
      'user-read-email',
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-playback-position',
      'playlist-read-collaborative',
      'playlist-read-private',
    ],
    state,
  );

  res.redirect(authorizeURL);
});

app.get('/tamashi/callback', async (req, res, next) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const storedState = req.cookies ? req.cookies[stateKey] : null;
  const userId = req.cookies ? req.cookies['userId'] : null;

  if (state === null || state !== storedState) {
    return next(new Error('State does not match!'));
  } else if (userId === null) {
    return next(new Error('No userId found in cookie!'));
  }

  res.clearCookie(stateKey);
  res.clearCookie('userId');

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);

    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    logger.debug('Saving refresh token to user: ', userId);
    await storeRefreshToken(userId, refresh_token);

    const userData = await spotifyApi.getMe();
    logger.debug('API request successful', userData.body);

    // Optionally: Redirect to a success page or send a success response
    res.send('Authentication successful!');
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  res.status(500).json({
    status: 500,
    errorMessage: err.message,
  });
});

export default app;

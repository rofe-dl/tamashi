import express, { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { URLSearchParams } from 'url';
import { storeRefreshToken } from './db';
import { ngrokURL, spotify, NODE_ENV, serverURL } from './config.json';
import logger from './utils/logger';

const client_id = spotify.clientId;
const client_secret = spotify.clientSecret;
const redirect_uri =
  NODE_ENV === 'production'
    ? serverURL + '/tamashi/callback'
    : ngrokURL + '/tamashi/callback';

const stateKey = 'spotify_auth_state';

const generateRandomString = (length: number): string => {
  return crypto.randomBytes(60).toString('hex').slice(0, length);
};

const app = express();
app.use(cookieParser());

app.get('/tamashi/login', (req, res, next) => {
  const state = generateRandomString(16);
  const { userId } = req.query;

  if (!userId) return next(new Error('User ID not found from query parameters'));

  res.cookie(stateKey, state);
  res.cookie('userId', userId);

  const scope = [
    'user-read-private',
    'user-read-email',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-playback-position',
    'playlist-read-collaborative',
    'playlist-read-private',
  ].join(' ');

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri,
    state,
    show_dialog: 'true',
  }).toString();

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/tamashi/callback', async (req, res, next) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
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
    const authOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code: code as string,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    };

    const tokenResponse = await fetch(
      'https://accounts.spotify.com/api/token',
      authOptions,
    );

    if (!tokenResponse.ok) {
      throw new Error('Token request failed');
    }

    const { access_token, refresh_token } = await tokenResponse.json();
    logger.debug('Saving refresh token to user: ', userId);
    await storeRefreshToken(userId, refresh_token);

    const userOptions = {
      headers: { Authorization: `Bearer ${access_token}` },
    };

    const userResponse = await fetch('https://api.spotify.com/v1/me', userOptions);
    if (!userResponse.ok) {
      throw new Error('User request failed');
    } else {
      logger.debug('API request successful');
    }

    const userData = await userResponse.json();
  } catch (error) {
    logger.error(error);
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

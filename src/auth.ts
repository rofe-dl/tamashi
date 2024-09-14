import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
// import cors from 'cors';
import { URLSearchParams } from 'url';
import { connectDB, storeRefreshToken } from './db';
import { ngrokURL, spotify } from './config.json';
import logger from './utils/logger';

const client_id = spotify.clientId;
const client_secret = spotify.clientSecret;
const redirect_uri = ngrokURL + '/callback';

const stateKey = 'spotify_auth_state';

connectDB();

const generateRandomString = (length: number): string => {
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
};

const app = express();
app.use(cookieParser());

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    const { userId } = req.query;
    res.cookie(stateKey, state);
    res.cookie("userId", userId);

    const scope = 'user-read-private user-read-email';
    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog: 'true',
    }).toString();

    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    const userId = req.cookies ? req.cookies['userId'] : null;

    if (state === null || state !== storedState) {
        logger.error("error state_mismatch");
        return;
    }

    if (userId === null) {
        logger.error("error no userId in cookie");
        return;
    }

    res.clearCookie(stateKey);
    res.clearCookie('userId');

    try {
        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                code: code as string,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            })
        };

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions);
        if (!tokenResponse.ok) {
            throw new Error('Token request failed');
        }

        const { access_token, refresh_token } = await tokenResponse.json();
        logger.info("got refresh token, saving to userId", userId);
        await storeRefreshToken(userId, refresh_token);

        const userOptions = {
            headers: { Authorization: `Bearer ${access_token}` }
        };

        // check if API request works

        const userResponse = await fetch('https://api.spotify.com/v1/me', userOptions);
        if (!userResponse.ok) {
            throw new Error('User request failed');
        } else {
            logger.info("API request successful")
        }



        const userData = await userResponse.json();

    } catch (error) {
        logger.error(error);
    }
});

app.listen(9000, () => {
    logger.info("listening on port 9000");
});
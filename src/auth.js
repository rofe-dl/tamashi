const client_id = "afd6c7cf09614804aca3599db3847340"
const client_secret = ""
const { connectDB, storeRefreshToken } = require('./db.js')
const { ngrokURL } = require('./config.json')
const express = require('express')
const redirect_uri = ngrokURL + '/callback'
const crypto = require('crypto')
const cors = require('cors');
const querystring = require('querystring')
const cookieParser = require('cookie-parser');

connectDB()

const generateRandomString = (length) => {
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
}

const stateKey = 'spotify_auth_state'; //prolly shoudnt expose this


const app = express()
app.use(cookieParser())


app.get('/login', (req, res) => {
    const state = generateRandomString(16)
    const { userId } = req.query
    res.cookie(stateKey, state)
    res.cookie("userId", userId)
    console.log('reidrect url', redirect_uri)
    console.log('userId------->', userId)
    const scope = 'user-read-private user-read-email'

    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog: true,

    }).toString()

    console.log(queryParams)

    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`)

})

app.get('/callback', async (req, res) => {
    const code = req.query.code || null
    const state = req.query.state || null
    const storedState = req.cookies ? req.cookies[stateKey] : null
    const userId = req.cookies ? req.cookies['userId'] : null

    if (state === null || state !== storedState) {
        console.log("error state_mismatch")
        return
    }

    if (userId === null) {
        console.log("error no userId in cookie")
        return
    }
    res.clearCookie(stateKey)
    res.clearCookie('userId')

    try {
        const authOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'

            })

        }

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions)
        if (!tokenResponse.ok) {
            throw new Error('Token request failed')
        }
        const { access_token, refresh_token } = await tokenResponse.json()

        console.log("got refresh token, saving to userId", userId)
        await storeRefreshToken(userId, refresh_token)
        const userOptions = {
            headers: { Authorization: `Bearer ${access_token}` }

        }
        const userResponse = await fetch('https://api.spotify.com/v1/me', userOptions)
        if (!userResponse.ok) {
            throw new Error('User request failed')
        }

        const userData = await userResponse.json()
        console.log(userData)


    } catch (error) {
        console.error(error)
    }
})

app.listen(9000)
console.log("listening on port 9000")
# Ngrok Setup Instructions

- [Download ngrok and extract it](https://dashboard.ngrok.com/get-started/setup)
- Run `ngrok config add-authtoken <your-token>`
- Then run `ngrok http 8080` (whatever your `SERVER_PORT` is in `config.env`)
- The URL that's shown beside `Forwarding` will be the domain of the callback URL. Paste it in `SPOTIFY_REDIRECT_URI_DEV` in `config.env`. Make sure it then ends with `/tamashi/callback`
- Put this value in the Redirect URI settings of the app in your Spotify developer dashboard

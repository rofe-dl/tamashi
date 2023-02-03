# Spotify Developer Dashboard Instructions

- [Developer dashboard](https://developer.spotify.com/dashboard/applications)
- Give it whatever name and description you want.
- Note the Client ID and Client Secret (don't share the secret with anyone), you'll need these later in the `config.env` and `application.yml` files.
- Spotify will needed a publicly accessible redirect URL when authorizing users through the bot. Set this in the application settings from the dashboard. The value will be the same as what you put in `SPOTIFY_REDIRECT_URI` or `SPOTIFY_REDIRECT_URI_DEV` later on.
- Without a quota extension from Spotify, you can have a maximum of 25 users (excluding yourself) use the `/followme` command. You'll have to add their emails in the `Users And Access` section of the dashboard.

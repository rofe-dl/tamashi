# T a m a s h i

![tamashi_img](./docs/tamashi.jpg)

A discord bot that can follow what a Spotify user is listening to and play it in a voice channel so everyone can listen in simultaneously. Although this feature already exists in Discord with the Spotify integration (Listen Along), only premium Spotify users get to use it. This bot can be a viable alternative.

Apart from that, it also supports manually playing songs with the `/play` command. To see all the commands, use `/help`.

And no, I don't have plans to host and make this a public bot for everyone. This is just a hobby project for private use in my Discord servers. Please set it up yourselves.

## How do I set this up?

1. Download this codebase.
1. [Install Node.js for your operating system however you want](./docs/setup_instructions/i_node.md)
1. [Go to the developer dashboard of Spotify and create a new application there](./docs//setup_instructions/i_spotify_dev.md)
1. [Go to the developer dashboard of Discord and make a bot there](./docs/setup_instructions/i_discord_dev.md)
1. [Setup a Lavalink server](./docs/setup_instructions/i_lavalink.md)

1. [You'll need to have a Redis server running in the background. I recommend doing this in Docker as it's less of a hassle (especially in Windows)](./docs/setup_instructions/i_redis.md)

1. [Make a MongoDB database in Atlas](https://youtu.be/084rmLU1UgA?t=39)
   - Copy your link shown around `3:09` of the video and paste it into `MONGODB_URL` in your `config.env` file.
1. Fill out the fields in `application.yml` and `config.env` files if there's any left.
1. Final steps to start the bot:

   - To make the slash commands work, run `npm run deploycommands`. You'll only have to run this once. However, if you make any changes to the command names or add/delete new ones, run this again.
   - Run `npm run start:dev` if running the bot locally. If you're hosting it online, run `npm run start:prod`.

1. [**Only needed if you're running the bot locally**] [To make your local server publicly accessible as a callback for Spotify, use ngrok. It makes your localhost available to the public](./docs/setup_instructions/i_ngrok.md)

## Improvements

1. Pause the bot if user pauses Spotify
1. Docker image for easy setup
1. Rate limiting on Spotify Bot API
1. Queue music
1. Other misc. commands not related to music (maybe?)

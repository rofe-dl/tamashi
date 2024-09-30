# T a m a s h i

![tamashi_img](./docs/tamashi.jpg)

A discord bot that can follow what a Spotify user is listening to and play it in a voice channel so everyone can listen in simultaneously. Although this feature already exists in Discord with the Spotify integration (Listen Along), only premium Spotify users get to use it. This bot can be a viable alternative.

Apart from that, it also supports manually playing songs with the `/play` command.

And no, I don't have plans to host and make this a public bot for everyone. This is just a hobby project for private use in my Discord servers. Please set it up yourselves.

## Key Commands

| Command       | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `/followme`   | Makes the bot track what you're currently playing on Spotify!      |
| `/unfollowme` | Makes the bot stop tracking the current user's Spotify.            |
| `/followwho`  | Tells you who the bot is following.                                |
| `/play`       | Play a song using a search phrase or URLs from Spotify or YouTube. |
| `/pause`      | Pauses the currently playing song.                                 |
| `/resume`     | Resumes the currently playing song if it's paused.                 |
| `/stop`       | Stops the currently playing song.                                  |

## Setup Instructions

### Requirements

- Node.js v19 or above.
- Docker Compose.

### Steps

1. Clone the repo and run `npm i` in this directory.
1. Make Spotify app in your Spotify developer dashboard.
1. Make a Discord app in your Discord developer portal.
1. Make a free MongoDB database using Atlas.
1. Make a file called `application.yml` and copy the contents from `sample.lavalink.application.yml` into it. Fill up the fields marked `#INPUT` with your own values.
1. Make a file called `config.json` in ./src folder and fill it with your info just like in `sample.config.json`.
1. Run `docker compose up` in the project directory. (In the future, do `docker compose down` to delete the containers if you wanna start clean, or `docker compose stop` to just stop the containers)
1. To deploy the commands to your Discord servers, run `npm run deploycommands`.
1. Run `npm run start`.

### Things to look out for

1. In the Discord developer portal, when generating the invite link for the bot, set the scopes to `bot`, `voice` and `application.commands`. Then give it admin access from the bot permissions.
1. To test the bot locally, you can setup [ngrok](https://ngrok.com/use-cases/webhook-testing) to test the callback URL from Spotify for a public URL. You will also have to set this in the Spotify application settings from the dashboard (in the dashboard make sure it ends with `/tamashi/callback`). The public URL ngrok gives you will also have to be put in `config.json` file.
1. Without a quota extension from Spotify, you can have a maximum of 25 users (excluding yourself) use the `/followme` command. You'll have to add their emails in the `Users And Access` section of the dashboard.

## Tech Stack

- NodeJS
- Discord.js
- Express
- MongoDB with Mongoose
- Redis
- Lavalink
- Docker

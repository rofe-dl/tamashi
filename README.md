# T a m a s h i

![tamashi_img](./docs/tamashi.jpg)

**_(CURRENTLY IN DEVELOPMENT FOR v2. SO IT WONT WORK AT THE MOMENT.)_**

A discord bot that can follow what a Spotify user is listening to and play it in a voice channel so everyone can listen in simultaneously. Although this feature already exists in Discord with the Spotify integration (Listen Along), only premium Spotify users get to use it. This bot can be a viable alternative.

Apart from that, it also supports manually playing songs with the `/play` command. To see all the commands, use `/help`.

And no, I don't have plans to host and make this a public bot for everyone. This is just a hobby project for private use in my Discord servers. Please set it up yourselves.

## Key Commands

| Command      | Description                                                                            |
| ------------ | -------------------------------------------------------------------------------------- |
| `/help`      | Lists all the commands.                                                                |
| `/followme`  | Makes the bot track what you're currently playing on Spotify!                          |
| `/unfollow`  | Makes the bot stop tracking the current user's Spotify.                                |
| `/whofollow` | Tells you who the bot is following.                                                    |
| `/forgetme`  | Makes the bot forget your data so you can reauthorize it to access your Spotify again. |
| `/play`      | Play a song using a search phrase or URLs from Spotify or YouTube.                     |
| `/pause`     | Pauses the currently playing song.                                                     |
| `/resume`    | Resumes the currently playing song if it's paused.                                     |
| `/stop`      | Stops the currently playing song.                                                      |

## Setup Instructions

### Requirements

- Node.js v19 or above.
- Docker Compose.

### Steps

1. Clone the repo and run `npm i` in this directory.
1. Make a file called `application.yml` and copy the contents from `sample.lavalink.application.yml` into it. Fill up the fields marked `#INPUT` with your own values.
1. Make a file called `config.json` in ./src folder and fill it with your info just like in `sample.config.json`.
1. Run `docker compose up` in the project directory.
1. Run `npm run start`.

<!-- ## How do I set this up?

### **Using Docker (the easy way)**

1. Make sure you have Docker and Docker Compose installed.
1. Make a file called `config.env` and `application.yml` in a folder and copy the contents of my `sample.config.env` and `sample.lavalink.application.yml` respectively into it.
1. [Go to the developer dashboard of Spotify and create a new application there](./docs//setup_instructions/i_spotify_dev.md).
1. [Go to the developer dashboard of Discord and make a bot there](./docs/setup_instructions/i_discord_dev.md).
1. [Make a MongoDB database in Atlas](https://youtu.be/084rmLU1UgA?t=39).
   - Copy your link shown around `3:09` of the video and paste it into `MONGODB_URL` in your `config.env` file.
1. **IMPORTANT**: Replace the values in both `config.env` and `application.yml` files with your own config info where I tagged `#INPUT`.
1. In the same folder, make a `docker-compose.yml` file and make it just like mine without changing anything inside.
1. Final steps to start the bot:

   - Open the terminal in this folder. You should have 3 files in this folder, `config.env`, `application.yml` and `docker-compose.yml`.
   - Run `docker-compose pull`.
   - To finally start the bot, run `docker-compose up`. Use the `-d` flag at the end if you wanna run it in the background.
   - To make the slash commands work, enter the shell of the container by running `docker exec -ti <container name of tamashi-bot> /bin/bash`. Then, run `npm run deploycommands`. Exit the shell using `exit` command. You'll only have to run this once. However, if you make any changes to the command names or add/delete new ones, deploy the commands again.
   - To stop the bot, just press Ctrl + C.

### **Manual Setup (the hard way)**

1. Download this codebase.
1. [Install Node.js for your operating system however you want](./docs/setup_instructions/i_node.md)
1. [Go to the developer dashboard of Spotify and create a new application there](./docs//setup_instructions/i_spotify_dev.md).
1. [Go to the developer dashboard of Discord and make a bot there](./docs/setup_instructions/i_discord_dev.md).
1. [You'll need to have a Redis server running in the background. I recommend doing this in Docker as it's less of a hassle (especially in Windows)](./docs/setup_instructions/i_redis.md).
1. Setup a Lavalink server [manually](./docs/setup_instructions/i_lavalink.md) OR [using Docker for this as well](./docs/setup_instructions/i_lavalink_docker.md).
1. [Make a MongoDB database in Atlas](https://youtu.be/084rmLU1UgA?t=39).
   - Copy your link shown around `3:09` of the video and paste it into `MONGODB_URL` in your `config.env` file.
1. Fill out the fields in `application.yml` and `config.env` files if there's any left.
1. Final steps to start the bot:

   - To make the slash commands work, run `npm run deploycommands`. You'll only have to run this once. However, if you make any changes to the command names or add/delete new ones, run this again.
   - Run `npm run start` if running the bot locally.

### **If Running Locally**

[**Only needed if you're running the bot on your PC**] [To make your local server publicly accessible as a callback for Spotify, use ngrok. It makes your localhost available to the public using SSH tunnels](./docs/setup_instructions/i_ngrok.md) -->

## Tech Stack

- NodeJS
- Discord.js
- Express
- MongoDB with Mongoose
- Redis
- Lavalink
- Docker

<!-- ## Improvements

1. Queue music
1. Other misc. commands not related to music (maybe?) -->

### Note to self:

- To release new versions, change tag in `docker-compose.yml`, `package.json` and README. Build the new images using `docker-compose build --no-cache`. Push it using `docker-compose push`.

# Redis Setup Instructions

- Install Docker
- Run the command `docker run --name my-redis -p 6379:6379 redis`
- If you already ran it before and you wanna restart it, run `docker start -a my-redis`.
- The redis server is what tracks whose Spotify is being followed and it gets flushed everytime the bot is restarted.

# Lavalink Setup Instructions Using Docker

- Make a file called `application.yml` and keep it somewhere.
- Copy the contents of the `sample.lavalink.application.yml` into this new file and fill it with your own config info where I tagged `#INPUT`.
- Run the command `docker run --name my-lavalink -p 2333:2333 -v <THE/PATH/TO/YOUR/application.yml>:/opt/Lavalink/application.yml fredboat/lavalink`.
- If you already ran it before and you wanna restart it, run `docker start -a my-lavalink`.
- To stop the server, run `docker stop my-lavalink`.

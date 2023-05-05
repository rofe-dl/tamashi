const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI } = require('../api/spotify/userAPI');
const { logError } = require('../utils/logger');
const MusicPlayer = require('./core/musicplayer');
require('dotenv').config({ path: 'config.env' });

module.exports.followUser = async (message, client) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  }

  // .author for interactions from slash commands, .user is from prefixes
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;
  const guildId = message.guildId;
  const currentlyFollowing = await client.redis.getEntry(guildId);

  if (currentlyFollowing?.userHandle) {
    return await message.reply({
      content: Replies.ALREADY_FOLLOWING_SOMEONE,
    });
  }

  const userInDB = await UserServices.getUser(userHandle);

  if (!userInDB) {
    const visitURL = await userAuthorizeBot(userHandle);

    return await message.reply({
      content: Replies.VISIT_AUTHORIZE_URL + `\n${visitURL}`,
      ephemeral: true,
    });
  }

  const refreshToken = userInDB.refreshToken;

  let accessToken;

  try {
    const { access_token } = await reAuthorizeUser(refreshToken);
    accessToken = access_token;
  } catch (err) {
    if (err.response?.data?.error === 'invalid_grant')
      return await message.reply({
        content: Replies.ACCESS_REVOKED,
      });
  }

  await message.reply({
    content: 'Following ' + user?.toString() + "'s Spotify now!",
  });

  const {
    trackURL,
    oAuthToken: updatedToken,
    isPaused,
  } = await UserAPI.getCurrentlyPlaying(accessToken, refreshToken);

  let result;
  if (trackURL) {
    result = await _getResolvedTrack(client, trackURL);

    if (isPaused === 'false') {
      await _play(
        guildId,
        message.member.voice.channelId,
        message.channelId,
        client,
        result
      );
    }
  }

  if (updatedToken !== accessToken)
    await client.redis.updateToken(updatedToken, guildId);

  const redisKey = guildId;
  const redisValue = {
    userHandle,
    accessToken,
    refreshToken,
    guildId,
    trackURL: trackURL ?? '',
    voiceChannelId: message.member.voice.channelId,
    textChannelId: message.channelId,
    isPaused,
  };

  await client.redis.addEntry(redisKey, redisValue);
};

module.exports.whofollow = async (message, client) => {
  const redisValue = await client.redis.getEntry(message.guildId);

  if (redisValue?.userHandle) {
    const userHandleArray = redisValue.userHandle.split('#');
    const followedUser = client.users.cache.find(
      (user) =>
        userHandleArray[0] + '#' + userHandleArray[1] ==
        user.username + '#' + user.discriminator
    );

    await message.reply({
      content:
        'Currently following ' + followedUser.toString() + "'s Spotify now.",
    });
  } else {
    await message.reply({
      content: Replies.NOT_FOLLOWING_ANYONE,
    });
  }
};

module.exports.unfollow = async (message, client, guildId) => {
  if (!guildId) guildId = message?.guildId;

  const redisValue = await client.redis.getEntry(guildId);

  if (redisValue?.userHandle) {
    const userHandleArray = redisValue.userHandle.split('#');
    const followedUser = client.users.cache.find(
      (user) =>
        userHandleArray[0] + '#' + userHandleArray[1] ==
        user.username + '#' + user.discriminator
    );
    await client.redis.deleteEntry(guildId);

    if (message) {
      await message.reply({
        content:
          'No longer following ' + followedUser.toString() + "'s Spotify now.",
      });
    } else {
      await client.channels.cache
        .get(redisValue.textChannelId)
        .send(
          'No longer following ' + followedUser.toString() + "'s Spotify now."
        );
    }

    await client.shoukaku.getNode().leaveChannel(guildId);
  } else if (message) {
    await message.reply({
      content: Replies.BUT_NOT_FOLLOWING_ANYONE,
    });
  }
};

async function _play(guildId, voiceChannelId, textChannelId, client, result) {
  const metadata = result?.tracks[0];

  if (!result?.tracks?.length) {
    return await client.channels.cache
      .get(textChannelId)
      .send(Replies.SONG_NOT_FOUND);
  }

  const player = new MusicPlayer(client, client.shoukaku.getNode());
  await player.play(result, guildId, voiceChannelId);

  await client.channels.cache
    .get(textChannelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );
}

async function _getResolvedTrack(client, trackURL) {
  const node = client.shoukaku.getNode();
  const player = new MusicPlayer(client, node);
  const result = await player.resolve(trackURL);

  return result;
}

module.exports.startScheduledSpotifyCalls = async (client) => {
  /**
   * Updates the song currently being played by each user being followed.
   */
  setInterval(async () => {
    // iterate over all servers bot has joined
    for (let guildId of client.guilds.cache.keys()) {
      // redis will have an entry if someone from this guild is being followed
      let redisValue = await client.redis.getEntry(guildId);
      if (!redisValue.accessToken || !redisValue.refreshToken) continue;

      // parallel calls to Spotify API for every follow
      UserAPI.getCurrentlyPlaying(
        redisValue.accessToken,
        redisValue.refreshToken
      )
        .then(async (response) => {
          try {
            if (response?.oAuthToken !== redisValue.accessToken) {
              // updated token received so update entry in redis
              await client.redis.updateToken(response.oAuthToken, guildId);
            }

            // song changed
            if (response?.trackURL !== redisValue.trackURL) {
              if (!response.trackURL || response.isPaused === 'true') return;
              const result = await _getResolvedTrack(
                client,
                response?.trackURL
              );

              await _play(
                guildId,
                redisValue.voiceChannelId,
                redisValue.textChannelId,
                client,
                result
              );

              redisValue.trackURL = response.trackURL ?? '';
              redisValue.isPaused = response.isPaused;
              client.redis
                .addEntry(guildId, redisValue)
                .catch((err) => logError(err));
            } else if (response.isPaused !== redisValue.isPaused) {
              const player = client.shoukaku.getNode().players.get(guildId);

              if (player)
                player.setPaused(response.isPaused === 'true' ? true : false);
              else {
                const result = await _getResolvedTrack(
                  client,
                  response?.trackURL
                );
                await _play(
                  guildId,
                  redisValue.voiceChannelId,
                  redisValue.textChannelId,
                  client,
                  result
                );
              }

              redisValue.isPaused = response.isPaused ?? false;
              await client.redis.addEntry(guildId, redisValue);
            }
          } catch (err) {
            logError(err);
          }
        })
        .catch((err) => logError(err));
    }
  }, Number.parseInt(process.env.SPOTIFY_REQUEST_INTERVAL_MS));
};

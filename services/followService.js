const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI } = require('../api/spotify/userAPI');
const { logError } = require('../utils/logger');
const MusicPlayer = require('./core/musicplayer');

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
    progressMs,
    durationMs,
    isPaused,
  } = await UserAPI.getCurrentlyPlaying(accessToken, refreshToken);

  if (trackURL && isPaused === 'false')
    await _play(
      guildId,
      message.member.voice.channelId,
      message.channelId,
      client,
      trackURL
    );

  if (updatedToken !== accessToken)
    await client.redis.updateToken(updatedToken, guildId);

  const redisKey = guildId;
  const redisValue = {
    userHandle,
    accessToken,
    refreshToken,
    guildId,
    trackURL: trackURL ?? '',
    durationMs: durationMs ?? 1,
    voiceChannelId: message.member.voice.channelId,
    textChannelId: message.channelId,
    isPaused,
  };

  await client.redis.addEntry(redisKey, redisValue);
};

module.exports.whofollow = async (message, client) => {
  const followedUser = await client.redis.getEntry(message.guildId);

  if (followedUser?.userHandle) {
    await message.reply({
      content:
        'Currently following @' + followedUser?.userHandle + "'s Spotify now.",
    });
  } else {
    await message.reply({
      content: Replies.NOT_FOLLOWING_ANYONE,
    });
  }
};

module.exports.unfollow = async (message, client) => {
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;
  const guildId = message.guildId;

  const followedUser = await client.redis.getEntry(guildId);

  if (followedUser?.userHandle) {
    await client.redis.deleteEntry(guildId);
    await message.reply({
      content:
        'No longer following @' + followedUser?.userHandle + "'s Spotify now.",
    });

    await client.shoukaku.getNode().leaveChannel(guildId);
  } else {
    await message.reply({
      content: Replies.BUT_NOT_FOLLOWING_ANYONE,
    });
  }
};

async function _play(guildId, voiceChannelId, textChannelId, client, trackURL) {
  const node = client.shoukaku.getNode();
  const player = new MusicPlayer(client, node);
  const result = await player.resolve(trackURL);
  const metadata = result?.tracks[0];

  if (!result?.tracks?.length) {
    return await client.channels.cache
      .get(textChannelId)
      .send(Replies.SONG_NOT_FOUND);
  }

  await player.play(result, guildId, voiceChannelId);

  await client.channels.cache
    .get(textChannelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );
}

module.exports.startScheduledSpotifyCalls = async (client) => {
  /**
   * Updates the song currently being played by each user being followed.
   * Happens every 3 secs.
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

            const botProgressMs =
              client.shoukaku.getNode()?.players?.get(guildId)?.position ?? 0;

            // song changed
            if (response?.trackURL !== redisValue.trackURL) {
              redisValue.trackURL = response.trackURL ?? '';
              redisValue.durationMs = response.durationMs ?? 1;
              redisValue.isPaused = response.isPaused;
              await client.redis.addEntry(guildId, redisValue);

              if (!response.trackURL || response.isPaused === 'true') return;

              // change track after a delay if only small part of song is left
              if (
                _changeSongImmediately(botProgressMs, redisValue.durationMs)
              ) {
                await _play(
                  guildId,
                  redisValue.voiceChannelId,
                  redisValue.textChannelId,
                  client,
                  redisValue.trackURL
                );
              } else {
                setTimeout(async () => {
                  await _play(
                    guildId,
                    redisValue.voiceChannelId,
                    redisValue.textChannelId,
                    client,
                    redisValue.trackURL
                  );
                }, 14000);
              }
            } else if (response.isPaused !== redisValue.isPaused) {
              redisValue.isPaused = response.isPaused ?? false;
              client.shoukaku
                .getNode()
                .players.get(guildId)
                .setPaused(response.isPaused === 'true' ? true : false);

              await client.redis.addEntry(guildId, redisValue);
            }
            // if a song is playing, update the progress if its greater than 8s
            // uncommented this feature as the buffering gives a bad experience
            // else if (
            //   client.shoukaku.getNode().players.get(guildId).track &&
            //   Math.abs(botProgressMs - response.progressMs) > 8000
            // ) {
            //   client.shoukaku
            //     .getNode()
            //     .players.get(guildId)
            //     .seekTo(response.progressMs);
            // }
          } catch (err) {
            logError(err);
          }
        })
        .catch((err) => logError(err));
    }
  }, 1000);
};

/**
 * Function to determine if a song should be changed immediately or after a delay
 *
 * @param {int} botProgressMs how far the bot has played the song
 * @param {int} durationMs how far the user has played the song on spotify
 * @returns {boolean} true if song should immediately or else false
 */
function _changeSongImmediately(botProgressMs, durationMs) {
  return (botProgressMs % durationMs) / durationMs <= 0.9;
}

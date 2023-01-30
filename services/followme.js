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

  // todo check if already following this user

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
  } = await UserAPI.getCurrentlyPlaying(accessToken, refreshToken);

  if (trackURL) await _play(message, client, trackURL);

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
  };

  _startScheduledCalls(client, message);

  await client.redis.addEntry(redisKey, redisValue);
};

async function _play(message, client, trackURL, guildId) {
  const node = client.shoukaku.getNode();
  const player = new MusicPlayer(client, node);
  const result = await player.resolve(trackURL);
  const metadata = result.tracks[0];

  if (!result?.tracks?.length) {
    return await client.channels.cache
      .get(message.channelId)
      .send(Replies.SONG_NOT_FOUND);
  }

  await player.play(result, message, guildId);

  await client.channels.cache
    .get(message.channelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );
}

function _startScheduledCalls(client, message) {
  /**
   * Updates the song currently being played by each user being followed.
   * Happens every 3 secs.
   */
  setInterval(async () => {
    // iterate over all servers bot has joined
    for (let guildId of client.guilds.cache.keys()) {
      let value = await client.redis.getEntry(guildId);
      if (!value.accessToken || !value.refreshToken) continue;

      // parallel calls to Spotify API for every user
      UserAPI.getCurrentlyPlaying(value.accessToken, value.refreshToken)
        .then(async (response) => {
          if (response?.oAuthToken !== value.accessToken) {
            // updated token received so update entry in redis
            await client.redis
              .updateToken(response.oAuthToken, guildId)
              .catch((err) => logError(err));
          }

          // song changed
          if (response?.trackURL !== value.trackURL) {
            value.trackURL = response.trackURL ?? '';
            await client.redis.addEntry(guildId, value);

            const botProgressMs =
              client.shoukaku.getNode()?.players?.get(guildId)?.position ?? 0;

            // change track after a delay if only small part of song is left
            if ((botProgressMs % value.durationMs) / value.durationMs <= 0.9) {
              await _play(message, client, value.trackURL, guildId);
            } else {
              setTimeout(async () => {
                if (value.trackURL)
                  await _play(message, client, value.trackURL, guildId);
              }, 6500);
            }
          }
        })
        .catch((err) => logError(err));
    }
  }, 3000);
}

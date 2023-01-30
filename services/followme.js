const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI } = require('../api/spotify/userAPI');
const { logError } = require('../utils/errorlogger');
const MusicPlayer = require('./core/musicplayer');

module.exports.followUser = async (message, client) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  }

  // .author for interactions from slash commands, .user is from prefixes
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;
  const guildId = message.guildId;

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

  const { trackURL, oAuthToken: updatedToken } =
    await UserAPI.getCurrentlyPlaying(accessToken, refreshToken);

  if (trackURL) await _play(message, client, trackURL);

  if (updatedToken !== accessToken)
    await client.redis.updateToken(updatedToken, guildID);

  const redisKey = message.guildId;
  const redisValue = {
    userHandle,
    accessToken,
    refreshToken,
    guildId,
    trackURL: trackURL ?? '',
  };

  // updates the song currently being played by each user being followed
  // happens every 3 secs
  setInterval(async () => {
    // iterate over all servers bot has joined
    for (let guild of client.guilds.cache.keys()) {
      let value = await client.redis.getCurrentlyFollowing(guild);
      if (!value.accessToken || !value.refreshToken) continue;

      // parallel calls to Spotify API for every user
      UserAPI.getCurrentlyPlaying(value.accessToken, value.refreshToken)
        .then(async (response) => {
          // updated token received so update entry in redis
          if (response?.oAuthToken !== value.accessToken) {
            client.redis
              .updateToken(response.oAuthToken, guild)
              .catch((err) => logError(err));
          }

          const { progressMs, durationMs } = response;

          // song changed
          if (response?.trackURL !== value.trackURL) {
            value.trackURL = response.trackURL ?? '';
            client.redis.addCurrentlyFollowing(guild, value);

            setTimeout(async () => {
              if (value.trackURL) await _play(message, client, value.trackURL);
            }, 5000);
          }
        })
        .catch((err) => logError(err));
    }
  }, 3000);

  await client.redis.addCurrentlyFollowing(redisKey, redisValue);
};

async function _play(message, client, trackURL) {
  const node = client.shoukaku.getNode();
  const player = new MusicPlayer(client, node);
  const result = await player.resolve(trackURL);
  const metadata = result.tracks[0];

  if (!result?.tracks?.length) {
    return await client.channels.cache
      .get(message.channelId)
      .send(Replies.SONG_NOT_FOUND);
  }

  await player.play(result, message);

  await client.channels.cache
    .get(message.channelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );
}

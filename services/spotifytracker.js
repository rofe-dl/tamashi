const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI } = require('../api/spotify/userAPI');
const RedisCache = require('../utils/redisCache');
const { logError } = require('../utils/errorlogger');

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

  if (trackURL) await play(message, client, trackURL);

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

          // song changed
          if (response?.trackURL !== value.trackURL) {
            value.trackURL = response.trackURL ?? '';
            client.redis.addCurrentlyFollowing(guild, value);
            if (value.trackURL) await play(message, client, value.trackURL);
          }
        })
        .catch((err) => logError(err));
    }
  }, 3000);

  await client.redis.addCurrentlyFollowing(redisKey, redisValue);
};

async function play(message, client, trackURL) {
  const node = client.shoukaku.getNode();

  let result = await node.rest.resolve(trackURL);

  let metadata = result.tracks.shift();

  await node.leaveChannel(message.guild.id);
  let player = await node.joinChannel({
    guildId: message.guild.id,
    channelId: message.member.voice.channelId,
    shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
    deaf: true,
  });

  // some spotify direct urls don't work, so then resort to youtube
  player.on('exception', async () => {
    result = await node.rest.resolve(
      'ytsearch:' +
        metadata.info.title.toLowerCase() +
        ' ' +
        metadata.info.author.toLowerCase() +
        ' lyrics'
    );

    metadata = result.tracks.shift();

    await node.leaveChannel(message.guild.id);
    player = await node.joinChannel({
      guildId: message.guild.id,
      channelId: message.member.voice.channelId,
      shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
      deaf: true,
    });

    player.playTrack({ track: metadata.track }).setVolume(0.75);
  });

  await client.channels.cache
    .get(message.channelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );

  player.playTrack({ track: metadata.track }).setVolume(0.75);
}

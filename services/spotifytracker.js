const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI } = require('../api/spotify/userAPI');
const RedisCache = require('../utils/redisCache');

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
  const { access_token: accessToken } = await reAuthorizeUser(refreshToken);

  await message.reply({
    content: 'Following ' + user?.toString() + "'s Spotify now!",
  });

  const { trackURL, oAuthToken: updatedToken } =
    await UserAPI.getCurrentlyPlaying(accessToken, refreshToken);

  await play(message, client, trackURL);

  if (updatedToken !== accessToken)
    await client.redis.updateToken(updatedToken, guildID);

  const redisKey = message.guildId;
  const redisValue = {
    userHandle,
    accessToken,
    refreshToken,
    guildId,
    trackURL,
  };

  await client.redis.addCurrentlyFollowing(redisKey, redisValue, client.redis);
};

async function play(message, client, trackURL) {
  const node = client.shoukaku.getNode();

  const result = await node.rest.resolve(trackURL);
  const metadata = result.tracks.shift();

  await node.leaveChannel(message.guild.id);
  const player = await node.joinChannel({
    guildId: message.guild.id,
    channelId: message.member.voice.channelId,
    shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
    deaf: true,
  });

  await client.channels.cache
    .get(message.channelId)
    .send(
      `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`
    );

  player.playTrack({ track: metadata.track }).setVolume(0.75);
}

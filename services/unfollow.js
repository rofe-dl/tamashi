const Replies = require('../utils/enums/replies');

module.exports.unfollow = async (message, client) => {
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;
  const guildId = message.guildId;

  const followedUser = await client.redis.getCurrentlyFollowing(guildId);

  if (followedUser?.userHandle) {
    await client.redis.forceDeleteCurrentlyFollowing(guildId);
    await message.reply({
      content: 'No longer following ' + user?.toString() + "'s Spotify now.",
    });
  } else {
    await message.reply({
      content: Replies.NOT_FOLLOWING_ANYONE,
    });
  }
};

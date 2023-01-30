const Replies = require('../utils/enums/replies');

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
  } else {
    await message.reply({
      content: Replies.NOT_FOLLOWING_ANYONE,
    });
  }
};

const UserServices = require('../repository/user.services');
const Replies = require('../utils/enums/replies');

module.exports.forgetMe = async (message, client) => {
  // .author for interactions from slash commands, .user is from prefixes
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;

  const userInDB = await UserServices.deleteUser(userHandle);
  await client.redis.deleteCurrentlyFollowing(message.guildId, userHandle);

  if (!userInDB) {
    return await message.reply({
      content: Replies.CANT_FORGET_USER_I_DK,
    });
  }

  return await message.reply({
    content: Replies.FORGOT_YOU,
  });
};

const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { logError } = require('../utils/errorlogger');
const { userAuthorizeBot, reAuthorizeUser } = require('../api/spotify/auth');
const UserServices = require('../repository/user.services');
const { UserAPI, currentlyFollowing } = require('../api/spotify/userAPI');

module.exports.followUser = async (message, client) => {
  // .author for interactions from slash commands, .user is from prefixes
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;

  const userInDB = await UserServices.getUser(userHandle);

  if (!userInDB) {
    const visitURL = await userAuthorizeBot(userHandle);

    return await message.reply({
      content: Replies.VISIT_AUTHORIZE_URL + `\n${visitURL}`,
      ephemeral: true,
    });
  }

  const { access_token: accessToken } = await reAuthorizeUser(
    userInDB.refreshToken
  );

  currentlyFollowing.add(userHandle, accessToken, message.guildId);

  await message.reply({
    content: 'Following ' + user?.toString() + "'s Spotify now!",
  });
};

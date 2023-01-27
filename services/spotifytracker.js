const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { logError } = require('../utils/errorlogger');
const { authorizeUser } = require('../api/spotify/auth');

module.exports.followUser = async (message, client) => {
  // .author for interactions from slash commands, otherwise from prefixes
  const user = message.author ?? message.user;
  const userHandle = user?.username + '#' + user?.discriminator;

  const visitURL = await authorizeUser(message);

  await message.reply({
    content: Replies.VISIT_AUTHORIZE_URL + `\n${visitURL}`,
    ephemeral: true,
  });
};

module.exports = {
  SONG_NOT_FOUND: "I couldn't find any song by that name!",
  VISIT_AUTHORIZE_URL: `It seems you have not authorized me to follow your Spotify yet. Please visit the following link and grant access to me so I can track what you're listening to. You can revoke this anytime you want from Spotify account settings. After authorizing, try the command again!\n`,
  ACCESS_REVOKED: `I no longer have permission to access your Spotify data. In case you revoked it and want to reauthorize me, use the \`/forgetme\` command to reset yourself first and then try again!`,
  FORGOT_YOU: `I have successfully forgotten who you are. If you want to reauthorize me again, use the \`/followme\` command again!`,
  CANT_FORGET_USER_I_DK: `I couldn't find you in my database, so I can't exactly forget someone I don't even know.`,
  BUT_NOT_FOLLOWING_ANYONE: `But I'm not following anyone in the server...`,
  ALREADY_FOLLOWING_SOMEONE: `I'm already following someone here. Please use the \`/unfollow\` command first to set me free.`,
  NOT_FOLLOWING_ANYONE: `Not following anyone at the moment.`,
};

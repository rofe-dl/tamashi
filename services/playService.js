const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const MusicPlayer = require('./core/musicplayer');

module.exports.play = async (message, client, phrase) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  } else if (phrase.trim().length === 0)
    return await message.reply(Errors.SEARCH_TERM_EMPTY);

  const node = client.shoukaku.getNode();
  const player = new MusicPlayer(client, node);
  const result = await player.resolve(phrase);
  const metadata = result?.tracks[0];

  if (!result?.tracks?.length) {
    return await message.reply(Replies.SONG_NOT_FOUND);
  }

  await player.play(result, message);

  await message.reply({
    content: `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`,
  });
};

module.exports.pause = async (message, client) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  }

  // todo implement
};

module.exports.stop = async (message, client) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  }

  // todo implement
};

module.exports.resume = async (message, client) => {
  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  }

  // todo implement
};

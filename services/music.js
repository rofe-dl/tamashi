const Errors = require('../utils/errors');
const { logError } = require('../utils/errorlogger');

module.exports.play = async (message, client, phrase) => {
  // TODO check if artist and song title match, otherwise do youtube
  try {
    if (!message.member.voice.channel) {
      return await message.reply(Errors.USER_NOT_IN_VOICE);
    } else if (phrase.trim().length === 0)
      return await message.reply(Errors.SEARCH_TERM_EMPTY);

    const node = client.shoukaku.getNode();
    if (!node) return;

    phrase = 'ytsearch: ' + phrase;

    // checks if url is valid
    // new URL(phrase);

    const result = await node.rest.resolve(phrase);

    if (!result?.tracks.length) return;

    const metadata = result.tracks.shift();

    await node.leaveChannel(message.guild.id);
    const player = await node.joinChannel({
      guildId: message.guild.id,
      channelId: message.member.voice.channelId,
      shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
      deaf: true,
    });

    await message.reply({
      content: 'Playing the song you requested.',
    });
    player.playTrack({ track: metadata.track }).setVolume(0.75);
  } catch (error) {
    await message.reply({
      content: Errors.FRIENDLY_ERROR_MESSAGE,
    });
    logError(error);
  }
};

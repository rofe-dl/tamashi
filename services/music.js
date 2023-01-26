const Errors = require('../utils/errors');
const Replies = require('../utils/replies');
const { logError } = require('../utils/errorlogger');

module.exports.play = async (message, client, phrase) => {
  // todo if search phrases are given, find spotify, deezer or apple music link first
  try {
    if (!message.member.voice.channel) {
      return await message.reply(Errors.USER_NOT_IN_VOICE);
    } else if (phrase.trim().length === 0)
      return await message.reply(Errors.SEARCH_TERM_EMPTY);

    const node = client.shoukaku.getNode();
    if (!node) return;

    // checks if url is valid
    // new URL(phrase);

    let result = await node.rest.resolve(phrase);

    if (!result?.tracks.length) {
      // do a youtube search if song isn't found in streaming service
      phrase = 'ytsearch: ' + phrase;
      result = await node.rest.resolve(phrase);

      if (!result?.tracks.length) {
        return await message.reply(Replies.SONG_NOT_FOUND);
      }
    }

    const metadata = result.tracks.shift();

    await node.leaveChannel(message.guild.id);
    const player = await node.joinChannel({
      guildId: message.guild.id,
      channelId: message.member.voice.channelId,
      shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
      deaf: true,
    });

    player.playTrack({ track: metadata.track }).setVolume(0.75);

    await message.reply({
      content: `Now playing \`${metadata.info.title}\` by \`${metadata.info.author}\`.\n${metadata.info.uri}`,
    });
  } catch (error) {
    await message.reply({
      content: Errors.FRIENDLY_ERROR_MESSAGE,
    });
    logError(error);
  }
};

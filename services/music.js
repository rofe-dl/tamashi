const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { logError } = require('../utils/errorlogger');
const { isURL } = require('../utils/regex');
const SpotifyBotAPI = require('../api/spotify/botAPI');
const { PLAY_FROM, phraseHasFlag } = require('../utils/enums/commandflags');

module.exports.play = async (message, client, phrase) => {
  // todo pause and play buttons
  // todo rate limiting the api
  // todo make parallel spotify requests for each user
  // todo keep in memory of who is being followed
  // todo stop following on disconnect
  // todo check if app has been removed by user
  // todo queue feature
  // todo help command
  // todo write setup about lavalink, deploy-commands, ngrok
  try {
    if (!message.member.voice.channel) {
      return await message.reply(Errors.USER_NOT_IN_VOICE);
    } else if (phrase.trim().length === 0)
      return await message.reply(Errors.SEARCH_TERM_EMPTY);

    const node = client.shoukaku.getNode();
    if (!node) return;

    let result;
    const flag = phraseHasFlag(phrase);

    if (!isURL(phrase) && flag) {
      phrase = phrase.replace(flag, '');
      result = await manualResolve(phrase, flag, node);
    }

    if (!result?.tracks?.length) {
      result = await node.rest.resolve(phrase);
    }

    if (!result?.tracks?.length) {
      // do a youtube search if song isn't found in any streaming service
      phrase = 'ytsearch: ' + phrase;
      result = await node.rest.resolve(phrase);

      if (!result?.tracks?.length) {
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

async function manualResolve(phrase, flag, node) {
  if (flag === PLAY_FROM.SPOTIFY)
    phrase = await SpotifyBotAPI.getSpotifyLink(phrase);
  else if (flag === PLAY_FROM.SOUNDCLOUD) phrase = 'scsearch:' + phrase;
  else if (flag === PLAY_FROM.YOUTUBE) phrase = 'ytsearch:' + phrase;

  if (phrase) return await node.rest.resolve(phrase);
}

const Errors = require('../utils/enums/errors');
const Replies = require('../utils/enums/replies');
const { logError } = require('../utils/errorlogger');
const { isURL } = require('../utils/regex');
const { SpotifyBotAPI } = require('../api/spotify/botAPI');
const { PLAY_FROM, phraseHasFlag } = require('../utils/enums/commandflags');

module.exports.play = async (message, client, phrase) => {
  // todo pause and play buttons
  // todo rate limiting the api
  // todo stop following on disconnect
  // todo queue feature
  // todo help command
  // todo write setup about lavalink, deploy-commands, ngrok, redis
  // todo use forgetme command to reauthorize if removed access
  // todo what happens if song change while in different channel
  // todo what happens if change followme without stopfollowme command
  // todo have a common play method that handles no track found or no media url resolved

  if (!message.member.voice.channel) {
    return await message.reply(Errors.USER_NOT_IN_VOICE);
  } else if (phrase.trim().length === 0)
    return await message.reply(Errors.SEARCH_TERM_EMPTY);

  const node = client.shoukaku.getNode();

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
};

async function manualResolve(phrase, flag, node) {
  if (flag === PLAY_FROM.SPOTIFY)
    phrase = await SpotifyBotAPI.getSpotifyLink(phrase);
  else if (flag === PLAY_FROM.SOUNDCLOUD) phrase = 'scsearch:' + phrase;
  else if (flag === PLAY_FROM.YOUTUBE) phrase = 'ytsearch:' + phrase;

  if (phrase) return await node.rest.resolve(phrase);
}

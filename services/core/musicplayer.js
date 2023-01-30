const { PLAY_FROM, phraseHasFlag } = require('../../utils/enums/commandflags');
const { SpotifyBotAPI } = require('../../api/spotify/botAPI');
const { isURL } = require('../../utils/regex');

module.exports = class MusicPlayer {
  constructor(discordClient, shoukakuNode) {
    this.discordClient = discordClient;
    this.shoukakuNode = shoukakuNode;
  }

  async play(result, message, guildId) {
    let metadata = result.tracks.shift();
    let player;

    if (guildId) {
      player = this.shoukakuNode.players.get(guildId);
      if (player) player.stopTrack();
    }

    if (!player) player = await this._get_player(message);

    // some spotify urls get resolved but cant be played idk why
    // so for that exception, just play from youtube
    // https://deivu.github.io/Shoukaku/classes/guild_Player.Player.html#on
    player.on('exception', async () => {
      result = await this._youtubeResolve(
        metadata.info.title.toLowerCase() +
          ' ' +
          metadata.info.author.toLowerCase()
      );

      metadata = result.tracks.shift();

      this._execute(player, metadata);
    });

    this._execute(player, metadata);
  }

  _execute(player, metadata) {
    player.playTrack({ track: metadata.track }).setVolume(0.75);
  }

  async _get_player(message) {
    await this.shoukakuNode.leaveChannel(message.guild.id);
    const player = await this.shoukakuNode.joinChannel({
      guildId: message.guild.id,
      channelId: message.member.voice.channelId,
      shardId: 0, // if unsharded it will always be zero (depending on your library implementation),
      deaf: true,
    });

    return player;
  }

  async resolve(phrase) {
    let result;

    // if it's a URL, just play it directly
    if (isURL(phrase)) {
      result = await this._defaultResolve(phrase);
    } else {
      // if it's a search phrase, check for flags like -yt, -sp and -sc
      const flag = phraseHasFlag(phrase);

      if (flag) {
        phrase = phrase.replace(flag, '');
        result = await this._manualResolve(phrase, flag);
      } else {
        result = await this._defaultResolve(phrase);
      }
    }

    // if url fails, search phrase fails and flag specific command fails
    // just resort to a youtube lyric video
    if (!result?.tracks?.length) {
      result = await this._youtubeResolve(phrase);
    }

    return result;
  }

  async _defaultResolve(phrase) {
    if (phrase) return await this.shoukakuNode.rest.resolve(phrase);
  }

  async _youtubeResolve(phrase) {
    // lyric videos from youtube will not have extra sounds
    phrase = 'ytsearch:' + phrase + ' lyrics';
    return await this._defaultResolve(phrase);
  }

  async _manualResolve(phrase, flag) {
    if (flag === PLAY_FROM.SPOTIFY)
      phrase = await SpotifyBotAPI.getSpotifyLink(phrase);
    else if (flag === PLAY_FROM.SOUNDCLOUD) phrase = 'scsearch:' + phrase;
    else if (flag === PLAY_FROM.YOUTUBE) phrase = 'ytsearch:' + phrase;

    if (phrase) return await this.shoukakuNode.rest.resolve(phrase);
  }
};

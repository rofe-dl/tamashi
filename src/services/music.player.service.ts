import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';
import { LoadType, Playlist, Shoukaku, Track } from 'shoukaku';
import { songInfoEmbed } from 'utils/embeds';
import logger from 'utils/logger';

export const play = async (
  interaction: ChatInputCommandInteraction,
  searchPhrase: string,
  shoukaku: Shoukaku,
) => {
  const guildMember = interaction.member as GuildMember;

  if (!guildMember?.voice?.channel?.id) {
    await interaction.reply({
      content: `You're not connected to any voice channel! >:(`,
      ephemeral: true,
    });

    return;
  }

  await shoukaku.leaveVoiceChannel(interaction.guildId as string);

  const player = await shoukaku.joinVoiceChannel({
    guildId: interaction.guildId as string,
    channelId: guildMember.voice?.channel?.id as string,
    shardId: 0,
  });

  const node = shoukaku.options.nodeResolver(shoukaku.nodes);

  /**
   * Deferring reply, as interaction only waits 3s
   * for a reply before it fails. Doing so because
   * song searching can take some time.
   */
  await interaction.deferReply();

  /**
   * If it's a URL, pass it to Lavalink to resolve directly
   * Otherwise, try youtube music, otherwise last resort -> youtube lyrics
   */
  if (!isURL(searchPhrase)) searchPhrase = 'ytmsearch: ' + searchPhrase;
  let result = await node?.rest.resolve(searchPhrase);

  if (result?.loadType !== LoadType.SEARCH && result?.loadType !== LoadType.TRACK) {
    if (isURL(searchPhrase)) {
      // TODO: If a Spotify URL fails, get song name from spotify API
      // and play it from youtube
    }
    searchPhrase = searchPhrase.replace('ytmsearch', 'ytsearch') + ' lyrics';
    result = await node?.rest.resolve(searchPhrase);
  }

  let track: Track;

  if (result?.loadType === LoadType.SEARCH) {
    // if it's multiple search results, take first one
    track = result.data.shift() as Track;
  } else if (result?.loadType === LoadType.TRACK) {
    track = result.data as Track;
  } else if (
    result?.loadType === LoadType.PLAYLIST ||
    result?.loadType === LoadType.EMPTY
  ) {
    await interaction.editReply({
      content: `Didn't really find the song you're looking for :(`,
    });

    return;
  } else {
    throw new Error('An error occurred while trying to play that song');
  }

  await Promise.all([
    player.playTrack({ track: { encoded: track.encoded } }),
    interaction.editReply({
      embeds: [await decorateEmbed(songInfoEmbed, track)],
    }),
  ]);

  // TODO: Implement pause/play/stop buttons
};

export const changePlayerState = async (
  command: PlayerCommand,
  interaction: ChatInputCommandInteraction,
  shoukaku: Shoukaku,
) => {
  const guildMember = interaction.member as GuildMember;

  if (!guildMember?.voice?.channel?.id) {
    await interaction.reply(`You're not connected to any voice channel! >:(`);
    return;
  }

  let player = shoukaku.players.get(interaction.guildId as string);
  if (!player?.track) {
    await interaction.reply("But I'm not playing anything at the moment..");
    return;
  }

  switch (command) {
    case PlayerCommand.PAUSE:
      player?.setPaused(true);
      await interaction.reply('Paused');
      break;
    case PlayerCommand.RESUME:
      player?.setPaused(false);
      await interaction.reply('Resumed');
      break;
    case PlayerCommand.STOP:
      player?.stopTrack();
      await interaction.reply('Stopped');
      break;
  }

  setTimeout(async () => await interaction.deleteReply(), 1500);
};

async function decorateEmbed(
  embedObject: typeof songInfoEmbed,
  track: Track,
): Promise<typeof songInfoEmbed> {
  let color;

  if (track?.info?.artworkUrl) {
    color = await getAverageColor(track.info.artworkUrl, { algorithm: 'sqrt' });
    color = Number('0x' + color.hex.slice(1, 7));
  } else {
    color = randomHexColorCode();
  }

  embedObject.color = color;
  embedObject.title = track.info.title;
  embedObject.url = track.info.uri || '';
  embedObject.description = track.info.author;
  embedObject.thumbnail = { url: track.info.artworkUrl || '' };

  return embedObject;
}

function isURL(s: string): boolean {
  const HTTP_URL_REGEX =
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

  const URL_REGEX =
    /^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  return HTTP_URL_REGEX.test(s) || URL_REGEX.test(s);
}

function getPlayerButtons(interaction: ChatInputCommandInteraction) {
  // TODO: Implement buttons
  const target = interaction.options.getUser('target');
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  const pause = new ButtonBuilder()
    .setCustomId('pause')
    .setLabel('Pause')
    .setStyle(ButtonStyle.Secondary);

  const play = new ButtonBuilder()
    .setCustomId('play')
    .setLabel('Play')
    .setStyle(ButtonStyle.Success);

  const stop = new ButtonBuilder()
    .setCustomId('stop')
    .setLabel('Stop')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(pause, play, stop);

  return row;
}

export enum PlayerCommand {
  PAUSE = 'pause',
  RESUME = 'resume',
  STOP = 'stop',
}

const randomHexColorCode = (): number => {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return Number('0x' + n.slice(0, 6));
};

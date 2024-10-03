import {
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  InteractionResponse,
  Message,
  TextChannel,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';
import { LoadType, Player, Shoukaku, Track } from 'shoukaku';
import { songInfoEmbed } from 'utils/embeds';
import logger from 'utils/logger';
import RedisClient from 'utils/redis';

/**
 * Helper function to play music, either from the
 * manual /play command or from following someone's
 * Spotify.
 */
const resolveAndPlayTrack = async (
  shoukaku: Shoukaku,
  guildId: string,
  voiceChannelId: string,
  textChannel: TextChannel,
  searchPhrase: string,
  sendReply: (
    message: string | { embeds: (typeof songInfoEmbed)[] },
  ) => Promise<void | Message<boolean>>,
): Promise<void> => {
  const connection = shoukaku.connections.get(guildId.toString());

  // Get existing player if still connected, otherwise join channel
  let player: Player | undefined;

  if (!connection) {
    /**
     * Sometimes the connection doesnt exist after a forced disconnect,
     * but shoukaku still thinks its connected. To workaround the bug,
     * we make it leave the channel.
     */
    await shoukaku.leaveVoiceChannel(guildId);
  } else {
    player = shoukaku.players.get(guildId) as Player;
    player?.stopTrack();
  }

  if (!player) {
    player = await shoukaku.joinVoiceChannel({
      guildId: guildId,
      channelId: voiceChannelId,
      shardId: 0,
    });
  }

  // Remove previous event listeners and set new ones
  player.clean();

  player.on('exception', (reason) => {
    logger.error(reason.exception);
  });

  player.on('closed', async () => {
    /**
     * If forced to disconnect/move, then unfollow the user if following them
     * and leave the channel so Shoukaku closes the connection.
     *
     * Choosing not to support moving the bot around voice channels
     * as there's no proper way to differentiate from disconnections.
     * We'd have to update the redis entry for the updated voice channel ID
     * if the bot is following someone as well; not worth the hassle.
     */
    try {
      await Promise.all([
        RedisClient.getInstance().delete(guildId),
        player.destroy(),
        textChannel.send("I didn't like that. Bye."),
      ]);

      await shoukaku.leaveVoiceChannel(guildId);
    } catch (err) {
      logger.error(err);
    }
  });

  const node = shoukaku.options.nodeResolver(shoukaku.nodes);

  // Check if search phrase is a URL
  if (!isURL(searchPhrase)) searchPhrase = 'ytmsearch: ' + searchPhrase;

  let result = await node?.rest.resolve(searchPhrase);

  // Retry search with YouTube lyrics if initial search fails
  if (result?.loadType !== LoadType.SEARCH && result?.loadType !== LoadType.TRACK) {
    if (isURL(searchPhrase)) {
      await sendReply(`Hmm unfortunately, I can't play that :(`);
      return;
    }

    searchPhrase = searchPhrase.replace('ytmsearch', 'ytsearch') + ' lyrics';
    result = await node?.rest.resolve(searchPhrase);
  }

  let track: Track;

  if (result?.loadType === LoadType.SEARCH) {
    track = result.data.shift() as Track;
  } else if (result?.loadType === LoadType.TRACK) {
    track = result.data as Track;
  } else if (
    result?.loadType === LoadType.PLAYLIST ||
    result?.loadType === LoadType.EMPTY
  ) {
    await sendReply(`Hmm unfortunately, I can't play that :(`);
    return;
  } else {
    throw new Error('An error occurred while trying to play that song');
  }

  await Promise.all([
    player.playTrack({ track: { encoded: track.encoded } }),
    sendReply({ embeds: [await decorateEmbed(songInfoEmbed, track)] }),
  ]);
};

export const playFromInteraction = async (
  interaction: ChatInputCommandInteraction,
  searchPhrase: string,
  shoukaku: Shoukaku,
) => {
  const textChannel = interaction.client.channels.cache.get(
    interaction.channelId,
  ) as TextChannel;
  const guildMember = interaction.member as GuildMember;

  await interaction.deferReply();

  await resolveAndPlayTrack(
    shoukaku,
    interaction.guildId as string,
    guildMember.voice?.channel?.id as string,
    textChannel,
    searchPhrase,
    async (message) => await interaction.editReply(message),
  );
};

export const play = async (
  textChannelId: string,
  voiceChannelId: string,
  guildId: string,
  searchPhrase: string,
  client: Client,
) => {
  const shoukaku = client.shoukaku;
  const textChannel = client.channels.cache.get(textChannelId) as TextChannel;

  await resolveAndPlayTrack(
    shoukaku,
    guildId,
    voiceChannelId,
    textChannel,
    searchPhrase,
    async (message) => await textChannel.send(message),
  );
};

const handlePlayerStateChange = async (
  player: Player | undefined,
  command: PlayerCommand,
  sendReply: (message: string) => Promise<Message<true> | InteractionResponse<boolean>>,
): Promise<void> => {
  switch (command) {
    case PlayerCommand.PAUSE:
      player?.setPaused(true);
      await sendReply('Paused');
      break;
    case PlayerCommand.RESUME:
      player?.setPaused(false);
      await sendReply('Resumed');
      break;
    case PlayerCommand.STOP:
      player?.stopTrack();
      await sendReply('Stopped');
      break;
  }
};

export const changePlayerStateFromInteraction = async (
  command: PlayerCommand,
  interaction: ChatInputCommandInteraction,
  shoukaku: Shoukaku,
) => {
  const guildMember = interaction.member as GuildMember;

  if (!guildMember?.voice?.channel?.id) {
    await interaction.reply(`You're not connected to any voice channel! >:(`);
    return;
  }

  const player = shoukaku.players.get(interaction.guildId as string);
  if (!player?.track) {
    await interaction.reply("But I'm not playing anything at the moment..");
    return;
  }

  await handlePlayerStateChange(
    player,
    command,
    async (message) => await interaction.reply(message),
  );
};

export const changePlayerState = async (
  textChannelId: string,
  guildId: string,
  command: PlayerCommand,
  client: Client,
) => {
  const shoukaku = client.shoukaku;
  const textChannel = client.channels.cache.get(textChannelId) as TextChannel;

  const player = shoukaku.players.get(guildId as string);
  await handlePlayerStateChange(
    player,
    command,
    async (message) => await textChannel.send(message),
  );
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

export enum PlayerCommand {
  PAUSE = 'pause',
  RESUME = 'resume',
  STOP = 'stop',
}

const randomHexColorCode = (): number => {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return Number('0x' + n.slice(0, 6));
};

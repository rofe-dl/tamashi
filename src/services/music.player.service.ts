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
import { timingService } from './timing.service';
import { ShoukakuQueue } from './queue.service';
import { CustomRest } from './custom.rest';
import { PlayerManager } from './player.manager';

const playerManagers = new Map<string, PlayerManager>();

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
  progress?: number | undefined,
  nextTrack?: string,
): Promise<void> => {
  const connection = shoukaku.connections.get(guildId.toString());
  const node = shoukaku.options.nodeResolver(shoukaku.nodes);
  if (!node) {
      throw new Error("Why the fuck is there no node");
  }

  const playerManager = playerManagers.get(guildId) ?? new PlayerManager(guildId, node, connection );
  playerManagers.set(guildId, playerManager);

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
    const connection = shoukaku.connections.get(guildId.toString());
    if (connection) { playerManager.setConnection(connection); } 
    else {logger.error("why is there no connection");}
    playerManager.setPlayer(player);
  }

  // Remove previous event listeners and set new ones
  player.clean();


  player.on('exception', (reason) => {
    logger.error(reason.exception);
  });

  //player.on('closed', async () => {
  //  /**
  //   * If forced to disconnect/move, then unfollow the user if following them
  //   * and leave the channel so Shoukaku closes the connection.
  //   *
  //   * Choosing not to support moving the bot around voice channels
  //   * as there's no proper way to differentiate from disconnections.
  //   * We'd have to update the redis entry for the updated voice channel ID
  //   * if the bot is following someone as well; not worth the hassle.
  //   */
  //  try {
  //    await Promise.all([
  //      RedisClient.getInstance().delete(guildId),
  //      player.destroy(),
  //      textChannel.send("I didn't like that. Bye."),
  //    ]);
  //
  //    await shoukaku.leaveVoiceChannel(guildId);
  //  } catch (err) {
  //    logger.error(err);
  //  }
  //});
  //

  if (searchPhrase === playerManager.currentTrackURL) { return }
  if (searchPhrase === playerManager.queuedTrackURL) {
      playerManager.playNext();
      if(nextTrack && nextTrack != playerManager.queuedTrackURL) {
          searchPhrase = nextTrack;
          //searchPhrase = 'https://open.spotify.com/track/6k0X05danQOXSBTVek5DU1'
          if (!isURL(searchPhrase)) searchPhrase = 'ytmsearch: ' + searchPhrase;

          let result2 = await node?.rest.resolve(searchPhrase);

          // Retry search with YouTube lyrics if initial search fails
          if (result2?.loadType !== LoadType.SEARCH && result2?.loadType !== LoadType.TRACK) {
              searchPhrase = searchPhrase.replace('ytmsearch', 'ytsearch') + ' lyrics';
              result2 = await node?.rest.resolve(searchPhrase);
          }

          let track2: Track | undefined;

          if (result2?.loadType === LoadType.SEARCH) {
              track2 = result2.data.shift() as Track;
          } else if (result2?.loadType === LoadType.TRACK) {
              track2 = result2.data as Track;
          } else if (
              result2?.loadType === LoadType.PLAYLIST ||
              result2?.loadType === LoadType.EMPTY
          ) {
              logger.error("Could not resolve the next track");
          } else {
              throw new Error('An error occurred while trying to play that song');
          }
          if (track2) {
              playerManager.queuedTrackURL = searchPhrase;
              playerManager.queueTrack(track2);
          }
      }
      return;

  } 
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
  // temporarily forcing newTrack to be true 
  //nextTrack = "shitfuck"
  console.log("Printing next track............", nextTrack)
  if(nextTrack && nextTrack != playerManager.queuedTrackURL) {
      searchPhrase = nextTrack;
      //searchPhrase = 'https://open.spotify.com/track/6k0X05danQOXSBTVek5DU1'
      if (!isURL(searchPhrase)) searchPhrase = 'ytmsearch: ' + searchPhrase;

      let result2 = await node?.rest.resolve(searchPhrase);

      // Retry search with YouTube lyrics if initial search fails
      if (result2?.loadType !== LoadType.SEARCH && result2?.loadType !== LoadType.TRACK) {
          searchPhrase = searchPhrase.replace('ytmsearch', 'ytsearch') + ' lyrics';
          result2 = await node?.rest.resolve(searchPhrase);
      }

      let track2: Track | undefined;

      if (result2?.loadType === LoadType.SEARCH) {
          track2 = result2.data.shift() as Track;
      } else if (result2?.loadType === LoadType.TRACK) {
          track2 = result2.data as Track;
      } else if (
          result2?.loadType === LoadType.PLAYLIST ||
          result2?.loadType === LoadType.EMPTY
      ) {
          logger.error("Could not resolve the next track");
      } else {
          throw new Error('An error occurred while trying to play that song');
      }
      if (track2) {
          playerManager.queuedTrackURL = searchPhrase;
          playerManager.queueTrack(track2);
      }
  } else {
      // keep the inactive player alive.
      playerManager.refreshQueue();
  }
    

  
  return new Promise<void>((resolve) => {
      // should probably add a timeout here so that app doesnt get stuck
      player.on('start', () => {
          logger.debug("Track started");
          if (node) {

              const getPlayers = () => {node.rest.getPlayers()
                                    .then(players => {
                                        console.log("lavaplayers", players)
                                    }); 
              }
              
              setInterval(getPlayers,5000) 
          }
          //player.clean(); 
          //timingService.setPlayer(player);
          //player.playTrack({ track: {encoded: track2.encoded}}, true);
          logger.debug("Trying to move track forward");
          if (progress && progress > 5000000) {
            player.seekTo(progress+500)
              .then(() => {
                  logger.debug("Successfully moved track forward");
                  resolve();
              })
          } else resolve();
      });
      (async () => {
          Promise.all([
              //player.playTrack( { track: { encoded: track.encoded } }),
              playerManager.currentTrackURL = searchPhrase,
              playerManager.playTrack(track),
              sendReply({ embeds: [await decorateEmbed(songInfoEmbed, track)] }),
          ]);
      })();
  });
};

export const playFromInteraction = async (
  interaction: ChatInputCommandInteraction,
  searchPhrase: string,
  shoukaku: Shoukaku,
  position?: number | undefined,
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
    position,
  );
};

export const play = async (
  textChannelId: string,
  voiceChannelId: string,
  guildId: string,
  searchPhrase: string,
  progress: number | undefined,
  client: Client,
  nextTrack?: string,
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
    progress,
    nextTrack,
  );
};

const handlePlayerStateChange = async (
  player: Player | undefined,
  command: PlayerCommand,
  sendReply: (message: string) => Promise<Message<true> | InteractionResponse<boolean>>,
  progress?: number | undefined
): Promise<void> => {
  switch (command) {
    case PlayerCommand.PAUSE:
      player?.setPaused(true);
      await sendReply('Paused');
      break;
    case PlayerCommand.RESUME:
      if (progress) {
          player?.seekTo(progress);
      };
      player?.setPaused(false); // check set paused vs resume performance
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
  progress?: number | undefined
) => {
  const shoukaku = client.shoukaku;
  const textChannel = client.channels.cache.get(textChannelId) as TextChannel;

  const player = shoukaku.players.get(guildId as string);
  await handlePlayerStateChange(
    player,
    command,
    async (message) => await textChannel.send(message),
    progress,
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

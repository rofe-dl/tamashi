import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { deleteRefreshToken, getRefreshToken } from 'db';
import { playFromInteraction } from 'services/music.player.service';
import RedisClient from 'utils/redis';
import { getCurrentPlaying, waitToSync } from 'services/sync.spotify.service';
import { IRedisValue } from 'types/redis.type';
import { ngrokURL, serverURL, NODE_ENV } from 'config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription('Follows your Spotify account and plays whatever you play'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildMember = interaction.member as GuildMember;

    if (!guildMember?.voice?.channel?.id) {
      await interaction.reply({
        content: `You're not connected to any voice channel! >:(`,
        ephemeral: true,
      });
      return;
    }

    const userId = interaction.user.id;
    const refreshToken = await getRefreshToken(userId);

    if (!refreshToken) {
      const contentString = `You need to authorize the bot to see what you're currently playing on Spotify.\nVisit ${NODE_ENV === 'production' ? serverURL : ngrokURL}/tamashi/login?userId=${userId}.`;

      await interaction.reply({
        content: contentString,
        ephemeral: true,
      });

      return;
    }

    let currentlyPlaying;

    try {
      currentlyPlaying = await getCurrentPlaying(refreshToken);
    } catch (err: any) {
      if (err.statusCode == 400) {
        const contentString = `It appears you may have revoked my access to your Spotify account.\nVisit ${NODE_ENV === 'production' ? serverURL : ngrokURL}/tamashi/login?userId=${userId}.`;

        await Promise.all([
          interaction.reply({
            content: contentString,
            ephemeral: true,
          }),
          deleteRefreshToken(userId),
        ]);

        return;
      } else throw err;
    }

    if (!currentlyPlaying)
      throw new Error('Currently playing song could not be retrieved');

    const { trackURL, accessToken, isPlaying, progress } = currentlyPlaying;

    if (!trackURL) {
      await interaction.reply("You're not really playing anything on Spotify");
      return;
    }

    

    let startTime = performance.now();
    await waitToSync(
      "free",
      accessToken, 
      () => playFromInteraction(interaction, trackURL, interaction.client.shoukaku, progress)
    );
    let endTime = performance.now();
    console.log("Time to search and play track:", endTime - startTime);

    //if (interaction.replied)
    //  await interaction.followUp({
    //    content: `Lead the way <@${userId}>!`,
    //  });
    //else
    //  await interaction.reply({
    //    content: `Lead the way <@${userId}>!`,
    //  });
    //
    /**
     * Using Redis to track which users the bot should follow in
     * each guild. Using Redis so multiple instances of the bot
     * won't cause issues down the line.
     */
    await RedisClient.getInstance().set(
      interaction.guildId,
      JSON.stringify({
        userId,
        refreshToken,
        accessToken,
        trackURL,
        isPlaying: true,
        voiceChannelId: (interaction.member as GuildMember).voice?.channel?.id,
        textChannelId: interaction.channelId,
      } as IRedisValue),
    );
  },
};

import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { getRefreshToken } from 'db';
import { playFromInteraction } from 'services/music.player.service';
import RedisClient from 'utils/redis';
import { getCurrentPlaying } from 'services/sync.spotify.service';
import { IRedisValue } from 'types/redis.type';
import { ngrokURL, serverURL, NODE_ENV } from 'config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription('Follows your Spotify account and plays whatever you play'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
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

    const { trackURL, accessToken, isPlaying } = await getCurrentPlaying(refreshToken);

    if (!trackURL) {
      await interaction.reply('You are not currently playing any song on Spotify.');
      return;
    }

    await playFromInteraction(interaction, trackURL, interaction.client.shoukaku);

    if (interaction.replied)
      await interaction.followUp({
        content: `Lead the way <@${userId}>!`,
      });
    else
      await interaction.reply({
        content: `Lead the way <@${userId}>!`,
      });

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

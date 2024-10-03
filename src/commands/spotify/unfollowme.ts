import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import logger from 'utils/logger';
import RedisClient from 'utils/redis';

export default {
  data: new SlashCommandBuilder()
    .setName('unfollowme')
    .setDescription('Unfollows your Spotify and stops playing'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const player = interaction.client?.shoukaku?.players?.get(
      interaction.guildId as string,
    );

    /**
     * Removes listeners as we're not doing a force disconnect.
     * We don't wanna trigger the listener on 'closed' event
     * as that is intended for forced disconnects only.
     */
    player?.clean();

    await Promise.all([
      interaction.client?.shoukaku?.leaveVoiceChannel(interaction.guildId as string),
      RedisClient.getInstance().delete(interaction.guildId),
    ]);

    await interaction.reply('Wow rude, ok bye.');
  },
};

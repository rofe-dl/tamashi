import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ngrokURL, serverURL, NODE_ENV } from 'config.json';

export default {
  data: new SlashCommandBuilder()
    .setName('authorize')
    .setDescription('Authorize Spotify'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const contentString = `You need to authorize the bot to see what you're currently playing on Spotify.
    Visit ${NODE_ENV === 'production' ? serverURL : ngrokURL}/login?userId=${userId}.`;

    await interaction.reply({
      content: contentString,
      ephemeral: true,
    });
  },
};

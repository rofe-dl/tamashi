import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ngrokURL } from 'config.json';

export default {
    data: new SlashCommandBuilder()
        .setName('authorize')
        .setDescription('Authorize Spotify'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const userId = interaction.user.id;
        await interaction.reply(`Login at ${ngrokURL}/login?userId=${userId}`);
    },
};

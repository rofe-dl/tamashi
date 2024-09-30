import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { playFromInteraction } from 'services/music.player.service';
import logger from 'utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Name of the song or a URL (Spotify, YouTube, Deezer)')
        .setRequired(true),
    )
    .setDescription('Plays a song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;
    const searchPhrase = interaction.options.getString('song') as string;

    const guildMember = interaction.member as GuildMember;

    if (!guildMember?.voice?.channel?.id) {
      await interaction.reply({
        content: `You're not connected to any voice channel! >:(`,
        ephemeral: true,
      });
      return;
    }

    await playFromInteraction(interaction, searchPhrase, shoukaku);
  },
};

import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { play } from 'services/music.player.service';
import logger from 'utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Name of the song or a URL')
        .setRequired(true),
    )
    .setDescription('Plays a song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;
    let searchPhrase = interaction.options.getString('song') as string;

    await play(interaction, searchPhrase, shoukaku);
  },
};

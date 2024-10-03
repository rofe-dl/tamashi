import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { getCurrentlyPlaying } from 'services/music.player.service';


export default {
  data: new SlashCommandBuilder()
    .setName('currently-playing')
    .setDescription('Shows the current playing song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;
    await getCurrentlyPlaying(interaction, shoukaku);

  },
};
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  changePlayerStateFromInteraction,
  PlayerCommand,
} from 'services/music.player.service';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the currently playing song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;

    await changePlayerStateFromInteraction(PlayerCommand.PAUSE, interaction, shoukaku);
  },
};

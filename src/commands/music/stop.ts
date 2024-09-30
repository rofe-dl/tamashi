import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  changePlayerStateFromInteraction,
  PlayerCommand,
} from 'services/music.player.service';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the currently playing song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;

    await changePlayerStateFromInteraction(PlayerCommand.STOP, interaction, shoukaku);
  },
};

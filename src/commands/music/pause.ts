import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { changePlayerState, PlayerCommand } from 'services/music.player.service';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the currently playing song'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const shoukaku = interaction.client.shoukaku;

    await changePlayerState(PlayerCommand.PAUSE, interaction, shoukaku);
  },
};

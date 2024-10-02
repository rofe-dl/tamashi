import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
  } from 'discord.js';
  import { getCurrentlyPlaying } from 'services/music.player.service';
  import logger from 'utils/logger';

  
  export default {
    data: new SlashCommandBuilder()
      .setName('currently-playing')
      .setDescription('Shows the current playing song'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
      const shoukaku = interaction.client.shoukaku;
      await getCurrentlyPlaying(interaction, shoukaku);


      // return the currently playing song as an embed
    },
  };
const { SlashCommandBuilder } = require('discord.js');
const PlayService = require('../services/playService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Will leave the voice channel if connected.'),

  // used by official slash commands
  async execute(interaction) {
    await PlayService.leave(interaction, interaction.client);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await PlayService.leave(message, client);
  },
};

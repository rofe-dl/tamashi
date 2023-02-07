const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const PlayService = require('../services/playService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the currently playing song.'),

  // used by official slash commands
  async execute(interaction) {
    await PlayService.pause(interaction, interaction.client);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await PlayService.pause(message, client);
  },
};

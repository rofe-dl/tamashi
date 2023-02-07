const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const HelpService = require('../services/helpService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all the commands available.'),

  // used by official slash commands
  async execute(interaction) {
    await HelpService.printCommands(interaction, interaction.client);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await HelpService.printCommands(message, client);
  },
};

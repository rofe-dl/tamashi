const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const HelpService = require('../services/help');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all the commands available'),

  // used by official slash commands
  async execute(interaction) {
    try {
      await HelpService.printCommands(interaction, interaction.client);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await HelpService.printCommands(message, client);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

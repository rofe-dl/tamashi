const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const ForgetMeService = require('../services/forgetme');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forgetme')
    .setDescription(
      'Makes the bot forget your data so you can reauthorize it to access your Spotify again !'
    ),

  // used by official slash commands
  async execute(interaction) {
    try {
      await ForgetMeService.forgetMe(interaction, interaction.client);
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
      await ForgetMeService.forgetMe(message, client);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

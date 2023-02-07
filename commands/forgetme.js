const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const ForgetMeService = require('../services/forgetService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forgetme')
    .setDescription(
      'Makes the bot forget your data so you can reauthorize it to access your Spotify again.'
    ),

  // used by official slash commands
  async execute(interaction) {
    await ForgetMeService.forgetMe(interaction, interaction.client);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await ForgetMeService.forgetMe(message, client);
  },
};

const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const UnfollowService = require('../services/unfollow');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unfollow')
    .setDescription("Makes the bot stop tracking the current user's Spotify."),

  // used by official slash commands
  async execute(interaction) {
    try {
      await UnfollowService.unfollow(interaction, interaction.client);
    } catch (error) {
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await UnfollowService.unfollow(message, client);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

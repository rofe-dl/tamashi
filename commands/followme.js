const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const { followUser } = require('../services/spotifytracker');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription(
      "Makes the bot track what you're currently playing on Spotify!"
    ),

  // used by official slash commands
  async execute(interaction) {
    try {
      await followUser(interaction, interaction.client);
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
      await followUser(message, client);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

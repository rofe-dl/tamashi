const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const FollowService = require('../services/followService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription(
      "Makes the bot track what you're currently playing on Spotify!"
    ),

  // used by official slash commands
  async execute(interaction) {
    try {
      await FollowService.followUser(interaction, interaction.client);
    } catch (error) {
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await FollowService.followUser(message, client);
    } catch (error) {
      logError(error);
    }
  },
};

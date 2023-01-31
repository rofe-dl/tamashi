const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const FollowService = require('../services/followService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whofollow')
    .setDescription('Tells you who the bot is following.'),

  // used by official slash commands
  async execute(interaction) {
    try {
      await FollowService.whofollow(interaction, interaction.client);
    } catch (error) {
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await FollowService.whofollow(message, client);
    } catch (error) {
      logError(error);
    }
  },
};

const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const FollowService = require('../services/followService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unfollow')
    .setDescription("Makes the bot stop tracking the current user's Spotify."),

  // used by official slash commands
  async execute(interaction) {
    await FollowService.unfollow(interaction, interaction.client);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await FollowService.unfollow(message, client);
  },
};

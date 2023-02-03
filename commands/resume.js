const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const PlayService = require('../services/playService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription("Resumes the currently playing song if it's paused."),

  // used by official slash commands
  async execute(interaction) {
    try {
      await PlayService.resume(interaction, interaction.client);
    } catch (error) {
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await PlayService.resume(message, client);
    } catch (error) {
      logError(error);
    }
  },
};

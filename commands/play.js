const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const PlayService = require('../services/play');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      'Play a song using a search phrase or URL. To specify a source, use -flags before the phrase.'
    )
    .addStringOption((option) =>
      option
        .setName('phrase')
        .setDescription('Name of the song and artist or a song URL')
        .setRequired(true)
    ),

  // used by official slash commands
  async execute(interaction) {
    try {
      await PlayService.play(
        interaction,
        interaction.client,
        interaction.options.getString('phrase')
      );
    } catch (error) {
      await interaction.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    try {
      await PlayService.play(message, client, args);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

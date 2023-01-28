const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const music = require('../services/music');
const { logError } = require('../utils/errorlogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      'Play a song using a search phrase. Spotify, Deezer, Apple Music and YouTube links are also valid!'
    )
    .addStringOption((option) =>
      option
        .setName('phrase')
        .setDescription('Name of the song and artist')
        .setRequired(true)
    ),

  // used by official slash commands
  async execute(interaction) {
    try {
      await music.play(
        interaction,
        interaction.client,
        interaction.options.getString('phrase')
      );
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
      await music.play(message, client, args);
    } catch (error) {
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
      logError(error);
    }
  },
};

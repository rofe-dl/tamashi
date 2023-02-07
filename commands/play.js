const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const PlayService = require('../services/playService');
const { logError } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      'Play a song using a search phrase or URL. To specify a source, use -flags before the phrase.'
    )
    .addStringOption((option) =>
      option
        .setName('phrase')
        .setDescription('Name of the song and artist or a song URL.')
        .setRequired(true)
    ),

  // used by official slash commands
  async execute(interaction) {
    await PlayService.play(
      interaction,
      interaction.client,
      interaction.options.getString('phrase')
    );
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await PlayService.play(message, client, args);
  },
};

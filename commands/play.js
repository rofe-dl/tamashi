const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const music = require('../services/music');

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
    await music.play(
      interaction,
      interaction.client,
      interaction.options.getString('phrase')
    );
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await music.play(message, client, args);
  },
};

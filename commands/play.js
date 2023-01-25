const Errors = require('../utils/errors');
const { SlashCommandBuilder } = require('discord.js');
const music = require('../services/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song using the title and artist name')
    .addStringOption((option) =>
      option
        .setName('term')
        .setDescription('Name of the song and artist')
        .setRequired(true)
    ),

  // used by official slash commands
  async execute(interaction) {
    await music.play(
      interaction,
      interaction.client,
      interaction.options.getString('term')
    );
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await music.play(message, client, args);
  },
};

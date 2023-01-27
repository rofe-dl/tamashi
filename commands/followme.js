const Errors = require('../utils/enums/errors');
const { SlashCommandBuilder } = require('discord.js');
const { followUser } = require('../services/spotifytracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription(
      "Makes the bot track what you're currently playing on Spotify!"
    ),

  // used by official slash commands
  async execute(interaction) {
    await followUser(interaction);
  },

  // used by prefix commands
  async executedFromPrefix(message, client, args) {
    await followUser(message);
  },
};

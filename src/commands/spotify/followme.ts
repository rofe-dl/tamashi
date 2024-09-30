import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { getRefreshToken } from 'db';
import { play } from 'services/music.player.service';
import { spotify } from 'config.json';
import logger from 'utils/logger';
import authorizeCommand from 'commands/spotify/authorize';

export default {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription('Follows your Spotify account and plays whatever you play'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;

    // Ensure the user is authenticated and has a valid refresh token
    const refreshToken = await getRefreshToken(userId);

    if (!refreshToken) {
      authorizeCommand.execute(interaction);

      return;
    }

    // Use the refresh token to get an access token
    const spotifyApi = new SpotifyWebApi({
      refreshToken,
      clientId: spotify.clientId,
      clientSecret: spotify.clientSecret,
    });

    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);

    // Get the currently playing song
    const currentPlaying = await spotifyApi.getMyCurrentPlayingTrack();
    const trackURL = currentPlaying?.body?.item?.external_urls?.spotify;

    if (!trackURL) {
      await interaction.reply('You are not currently playing any song on Spotify.');
      return;
    }

    await play(interaction, trackURL, interaction.client.shoukaku);

    await interaction.followUp({
      content: `I'm now following <@${userId}>!`,
    });
  },
};

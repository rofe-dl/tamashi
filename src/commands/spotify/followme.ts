import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import SpotifyWebApi from 'spotify-web-api-node';
import { getRefreshToken } from 'db';
import { play } from 'services/music.player.service';
import logger from 'utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('followme')
    .setDescription(
      'Follows your Spotify account and plays your currently playing song.',
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;

    try {
      // Ensure the user is authenticated and has a valid refresh token
      const refreshToken = await getRefreshToken(userId);
      if (!refreshToken) {
        await interaction.reply(
          'Please authenticate with Spotify first using the `/login` command.',
        );
        return;
      }

      // Use the refresh token to get an access token
      const spotifyApi = new SpotifyWebApi();
      spotifyApi.setRefreshToken(refreshToken);

      const data = await spotifyApi.refreshAccessToken();
      const accessToken = data.body['access_token'];
      spotifyApi.setAccessToken(accessToken);

      // Get the currently playing song
      const currentPlaying = await spotifyApi.getMyCurrentPlaybackState();
      if (!currentPlaying.body || !currentPlaying.body.is_playing) {
        await interaction.reply('You are not currently playing any song on Spotify.');
        return;
      }

      const track = currentPlaying.body.item;
      if (!track) {
        await interaction.reply('Could not fetch the currently playing track.');
        return;
      }

      // Follow the user's Spotify account
      await spotifyApi.followUsers([userId]);

      // Handle track or episode
      if ('artists' in track) {
        // It's a track
        const trackUri = track.external_urls.spotify;
        const shoukaku = interaction.client.shoukaku;
        await play(interaction, trackUri, shoukaku);

        await interaction.reply(
          `Now playing **${track.name}** by ${track.artists.map((a) => a.name).join(', ')}!`,
        );
      } else {
        // It's an episode (like a podcast)
        await interaction.reply(
          `You are currently playing an episode: **${track.name}**.`,
        );
      }
    } catch (error) {
      logger.error('Error in followme command: ', error);
      await interaction.reply(
        'Something went wrong while processing the followme command.',
      );
    }
  },
};

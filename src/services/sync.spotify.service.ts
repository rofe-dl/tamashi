import { Client } from 'discord.js';
import { spotify } from 'config.json';
import SpotifyWebApi from 'spotify-web-api-node';
import RedisClient from 'utils/redis';
import logger from 'utils/logger';
import { IRedisValue } from 'types/redis.type';
import { changePlayerState, play, PlayerCommand } from './music.player.service';

const spotifyApi = new SpotifyWebApi({
  clientId: spotify.clientId,
  clientSecret: spotify.clientSecret,
});

export default async (client: Client) => {
  const redis = RedisClient.getInstance();

  // iterate over all the servers joined by bot
  for (let guildId of Array.from(client.guilds.cache.keys())) {
    /**
     * I'm using Redis to lock 1 callback per guild.
     *
     * Because this function runs very frequently, the callbacks queued
     * upon retrieving the value from redis can sometimes run simultaneously
     * and not deal with the most updated data.
     *
     * So, for any specific guild, only 1 callback can run at a time.
     * If there's already one that's running in the background, it sets a lock
     * in Redis and other incoming callbacks don't run unless it's cleared.
     */
    const lockKey = `guild_lock:${guildId}`;
    const successfullyLocked = await redis.lock(lockKey);
    if (!successfullyLocked) {
      continue;
    }

    redis
      .get(guildId)
      .then(async (value: string | null) => {
        if (!value) return;
        const redisObject: IRedisValue = JSON.parse(value);

        const updatedCurrentPlaying = await getCurrentPlaying(
          redisObject.refreshToken,
          redisObject.accessToken,
        );

        // if the old access token expired, update it in redis as well
        if (updatedCurrentPlaying.accessToken !== redisObject.accessToken) {
          redisObject.accessToken = updatedCurrentPlaying.accessToken;
          await redis.set(guildId, JSON.stringify(redisObject));
        }

        if (redisObject?.trackURL !== updatedCurrentPlaying?.trackURL) {
          if (updatedCurrentPlaying.trackURL) {
            const { textChannelId, voiceChannelId } = redisObject;

            await play(
              textChannelId,
              voiceChannelId,
              guildId,
              updatedCurrentPlaying.trackURL,
              client,
            );
          }

          redisObject.trackURL = updatedCurrentPlaying.trackURL;
          redisObject.isPlaying = updatedCurrentPlaying.isPlaying;

          await redis.set(guildId, JSON.stringify(redisObject));
        } else if (redisObject.isPlaying !== updatedCurrentPlaying.isPlaying) {
          if (updatedCurrentPlaying.isPlaying) {
            await changePlayerState(
              redisObject.textChannelId,
              guildId,
              PlayerCommand.RESUME,
              client,
            );
          } else {
            await changePlayerState(
              redisObject.textChannelId,
              guildId,
              PlayerCommand.PAUSE,
              client,
            );
          }

          redisObject.isPlaying = updatedCurrentPlaying.isPlaying;

          await redis.set(guildId, JSON.stringify(redisObject));
        }
      })
      .finally(async () => {
        await redis.delete(lockKey);
      })
      // dont wanna spam Discord channel by mistake, so not using logger
      .catch(console.log);
  }
};

/**
 * Retrieves the currently playing track from Spotify, along with a possibly updated access token and playback status.
 * If an access token is not provided, it uses the refresh token to fetch a new one.
 *
 * @async
 * @function getCurrentPlaying
 *
 * @param {string} refreshToken - The Spotify refresh token used to get a new access token when needed.
 * @param {string} [accessToken] - Optional. The current Spotify access token. If not provided, the refresh token is used to get a new one.
 *
 * @returns {Promise<{ trackURL: string | undefined, accessToken: string, isPlaying: boolean }>}
 * - A promise resolving to an object with the following properties:
 *   - `trackURL`: The URL of the currently playing track on Spotify, or `undefined` if there is no track playing.
 *   - `accessToken`: The valid access token, which may be refreshed if expired or not provided initially.
 *   - `isPlaying`: A boolean indicating whether music is currently being played on the user's Spotify account.
 *
 * @throws {Error} Will throw an error if the Spotify API encounters issues fetching the current track, even after refreshing the access token.
 */
export async function getCurrentPlaying(
  refreshToken: string,
  accessToken?: string,
): Promise<{ trackURL: string | undefined; accessToken: string; isPlaying: boolean }> {
  spotifyApi.setRefreshToken(refreshToken);

  if (!accessToken) {
    const data = await spotifyApi.refreshAccessToken();
    accessToken = data.body['access_token'];
  }

  spotifyApi.setAccessToken(accessToken);

  let currentPlaying;

  // if it fails due to expired access token, refreshes it and tries again
  try {
    currentPlaying = await spotifyApi.getMyCurrentPlayingTrack();
  } catch {
    logger.debug('Failed to retrieve song with existing access token. Updating.');
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);

    currentPlaying = await spotifyApi.getMyCurrentPlayingTrack();
  }

  const trackURL = currentPlaying?.body?.item?.external_urls?.spotify;
  const isPlaying = currentPlaying?.body?.is_playing ? true : false;

  return { trackURL, accessToken, isPlaying };
}

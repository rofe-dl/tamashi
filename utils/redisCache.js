module.exports = class RedisCache {
  constructor(redisClient) {
    this.redisClient = redisClient;
  }

  async addCurrentlyFollowing(key, value) {
    await this.redisClient.hSet(key, value);
  }

  async updateAllCurrentlyPlaying() {
    // await this.redis.hGetAll();
  }

  async updateToken(updatedToken, guildID) {
    let value = await this.redisClient.hGetAll(guildID);
    value.accessToken = updatedToken;

    await this.redisClient.hSet(guildID, value);
  }
};

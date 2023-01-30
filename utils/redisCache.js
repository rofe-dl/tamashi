module.exports = class RedisCache {
  constructor(redisClient) {
    this.redisClient = redisClient;
  }

  async updateToken(updatedToken, guildId) {
    let value = await this.redisClient.hGetAll(guildId);
    value.accessToken = updatedToken;

    await this.redisClient.hSet(guildId, value);
  }

  async deleteCurrentlyFollowing(key, userHandle) {
    const value = await this.redisClient.hGetAll(key);
    if (value?.userHandle === userHandle) await this.redisClient.del(key);
  }

  async deleteEntry(key) {
    await this.redisClient.del(key);
  }

  async addEntry(key, value) {
    return await this.redisClient.hSet(key, value);
  }

  async getEntry(key) {
    return await this.redisClient.hGetAll(key);
  }
};

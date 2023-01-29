module.exports = class RedisCache {
  constructor(redisClient) {
    this.redisClient = redisClient;
  }

  async addCurrentlyFollowing(key, value) {
    await this.redisClient.hSet(key, value);
  }

  async getCurrentlyFollowing(key) {
    return await this.redisClient.hGetAll(key);
  }

  async updateToken(updatedToken, guildID) {
    let value = await this.redisClient.hGetAll(guildID);
    value.accessToken = updatedToken;

    await this.redisClient.hSet(guildID, value);
  }

  async deleteCurrentlyFollowing(key, userHandle) {
    const value = await this.redisClient.hGetAll(key);
    if (value?.userHandle === userHandle) await this.redisClient.del(key);
  }

  async forceDeleteCurrentlyFollowing(key) {
    await this.redisClient.del(key);
  }
};

import { createClient, RedisClientType } from 'redis';
import logger from './logger';
import { redis } from 'config.json';

class RedisClient {
  private static instance: RedisClient; // Singleton instance
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      // if running inside Docker, it'll use the host defined in docker compose file
      url: `redis://${process.env.REDIS_DOCKER_HOST || redis.host}:${redis.port}`,
      socket: { reconnectStrategy: false },
    });
    this.client.on('error', (err) => logger.error('Redis Client Error: ', err));
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;

      logger.info('Redis connected successfully');
    } else {
      logger.info('Redis is already connected.');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from Redis.');
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (err) {
      logger.error('Error flushing redis: ' + err);
    }
  }

  async set(key: string | null, value: string | null): Promise<void> {
    try {
      if (!key || !value) throw new Error('Cannot set key/value as null');

      await this.client.set(key, value);
      logger.debug(`Set key ${key} to ${value} successfully.`);
    } catch (error) {
      logger.error(`Error setting key ${key}:`, error);
    }
  }

  async get(key: string | null): Promise<string | null> {
    try {
      if (key == null) return null;

      const value = await this.client.get(key);
      logger.debug(`Retrieved key ${key} successfully.`);

      return value;
    } catch (error) {
      logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string | null): Promise<void> {
    try {
      if (key == null) throw new Error('Cannot remove key as null');

      await this.client.del(key);
      logger.debug(`Removed key ${key} successfully.`);
    } catch (error) {
      logger.error(`Error removing key ${key}:`, error);
    }
  }
}

export default RedisClient;

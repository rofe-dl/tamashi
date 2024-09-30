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
    if (!key || !value) throw new Error('Cannot set key/value as null');

    await this.client.set(key, value);
  }

  async lock(key: string) {
    // NX only sets the key/value if it doesnt exist, then returns truthy
    // EX sets an expiry time in seconds in case the entry never gets removed
    return await this.client.set(key, 'locked', { NX: true, EX: 20 });
  }

  async get(key: string | null): Promise<string | null> {
    if (key == null) return null;

    const value = await this.client.get(key);

    return value;
  }

  async delete(key: string | null): Promise<void> {
    if (key == null) throw new Error('Cannot remove key as null');

    await this.client.del(key);
  }
}

export default RedisClient;

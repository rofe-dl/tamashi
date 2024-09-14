import { createClient, RedisClientType } from 'redis';
import logger from './logger';


class RedisClient {
    private static instance: RedisClient; // Singleton instance
    private client: RedisClientType;
    private isConnected: boolean = false;

    private constructor(url: string) {
        this.client = createClient({ url });
        this.client.on('error', (err) => logger.error('Redis Client Error', err));
    }

    static getInstance(url: string): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient(url);
        }
        return RedisClient.instance;
    }

    public getClient(): RedisClientType { return this.client; }

    // Connect to Redis
    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
            this.isConnected = true;
            logger.info("Connected to Redis.");
        } else {
            logger.info("Redis is already connected.");
        }
    }

    // Disconnect from Redis
    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            logger.info("Disconnected from Redis.");
        }
    }

    // Set key-value pair
    async set(key: string, value: string): Promise<void> {
        try {
            await this.client.set(key, value);
            logger.info(`Set key ${key} to ${value} successfully.`);
        } catch (error) {
            logger.error(`Error setting key ${key}:`, error);
        }
    }

    // Get value by key
    async get(key: string): Promise<string | null> {
        try {
            const value = await this.client.get(key);
            logger.info(`Retrieved key ${key} successfully.`);
            return value;
        } catch (error) {
            logger.error(`Error getting key ${key}:`, error);
            return null;
        }
    }
}

export default RedisClient;

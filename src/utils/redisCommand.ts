import { redisClient } from "./redis";
import logger from './logger';

async function connectRedis() {
    try {
        await redisClient.connect();
        logger.info("Connected to Redis")
    }
    catch (error) { logger.error(error); }
}

async function get(key: string) {
    try {
        await redisClient.get(key);
        logger.info(`Retrieved key ${key} successfully.`);
    }
    catch (error) { logger.error(error); }
}

async function set(key: string, value: string) {
    try {
        await redisClient.set(key, value);
        logger.info(`Set key-value ${key} , ${value} successfully.`);
    }
    catch (error) { logger.error(error) }
}

export { get, set, connectRedis }
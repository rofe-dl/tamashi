import { createClient } from 'redis';
import logger from './logger';
import { redis } from '../config.json';

//test url with just 'localhost'
//Not sure how to exactly extract from the json in a pretty manner
const redisClient = createClient({
    url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error(err));

async function disconnectRedis() {
    try {
        await redisClient.disconnect();
        logger.info("Disconnected from Redis.")
    }
    catch (error) { logger.error(error); }
}

async function get(key: string) {
    try {
        const value = await redisClient.get(key);
        logger.info(`Retrieved key ${key} successfully.`);
        return value;
    }
    catch (error) {
        logger.error(error);
        return null;
    }
}

async function set(key: string, value: string) {
    try {
        await redisClient.set(key, value);
        logger.info(`Set key-value ${key} , ${value} successfully.`);
    }
    catch (error) { logger.error(error) }
}

(async () => {
    try {
        await redisClient.connect();
        logger.info("Connected to Redis.");
    } catch (error) {
        logger.error("Failed to connect to Redis:", error);
    }
})();


export { redisClient, disconnectRedis, get, set };

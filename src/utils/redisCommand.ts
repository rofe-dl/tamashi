import { redisClient } from "./my-redis";

async function get(key: string) {

    try {
        await redisClient.get(key);
    }
    catch (error) {
        console.error('Error getting value from Redis:', error);
    }
}

async function set(key: string, value: string) {

    try {
        await redisClient.set(key, value);
    }
    catch (error) {
        console.error('Error setting value in Redis:', error);
    }
}

export { get, set }
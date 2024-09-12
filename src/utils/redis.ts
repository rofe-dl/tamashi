import { createClient } from 'redis';
import logger from './logger';
import { redis } from '../config.json';


//test url with just 'localhost'
const redisClient = createClient({
    url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error(err));

export { redisClient };

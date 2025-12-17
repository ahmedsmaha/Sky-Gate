import { createClient, RedisClientType } from 'redis';

export class RedisService {
    public client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL,
        });

        this.client.on('error', (err: Error) => {
            console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis connected successfully');
        });
    }

    async getClient(): Promise<RedisClientType> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
        return this.client;
    }

    async disconnect(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.quit();
            console.log('Redis disconnected successfully');
        }
    }
}

export const redisService = new RedisService();

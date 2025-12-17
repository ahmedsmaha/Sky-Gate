import { redisService } from '../config/redis';

export class CacheService {
    private static readonly CACHE_TTL = Number.parseInt(process.env.REDIS_CACHE_TTL || '300'); // 5 minutes default

    static async get(key: string): Promise<unknown> {
        try {
            const client = await redisService.getClient();
            const data = await client.get(key);

            if (!data) {
                return null;
            }

            return JSON.parse(data);
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    static async set(key: string, value: unknown, ttl: number = CacheService.CACHE_TTL): Promise<void> {
        try {
            const client = await redisService.getClient();
            await client.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    static async del(key: string): Promise<void> {
        try {
            const client = await redisService.getClient();
            await client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            const client = await redisService.getClient();
            const keys = await client.keys(pattern);

            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Cache invalidate pattern error:', error);
        }
    }
}

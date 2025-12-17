import { CacheService } from '../src/services/cache.service';
import { redisService } from '../src/config/redis';
import { RedisClientType } from 'redis';

// Mock Redis client
jest.mock('../src/config/redis', () => ({
    redisService: {
        client: {
            get: jest.fn(),
            setEx: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            isOpen: true
        },
        getClient: jest.fn()
    }
}));

describe('CacheService', () => {
    let mockRedisClient: Partial<RedisClientType> & {
        get: jest.Mock;
        setEx: jest.Mock;
        del: jest.Mock;
        keys: jest.Mock;
    };

    beforeEach(() => {
        mockRedisClient = redisService.client as unknown as Partial<RedisClientType> & {
            get: jest.Mock;
            setEx: jest.Mock;
            del: jest.Mock;
            keys: jest.Mock;
        };
        (redisService.getClient as jest.Mock).mockResolvedValue(mockRedisClient);
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('get', () => {
        it('should return parsed data when cache hit', async () => {
            const testData = { id: 1, name: 'Test' };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

            const result = await CacheService.get('test-key');

            expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
            expect(result).toEqual(testData);
        });

        it('should return null when cache miss', async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const result = await CacheService.get('missing-key');

            expect(result).toBeNull();
        });

        it('should return null on JSON parse errors', async () => {
            mockRedisClient.get.mockResolvedValue('invalid-json');

            const result = await CacheService.get('bad-key');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });

        it('should return null and log error on Redis failure', async () => {
            mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));

            const result = await CacheService.get('error-key');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Cache get error:',
                expect.any(Error)
            );
        });

        it('should handle complex nested objects', async () => {
            const complexData = {
                user: { id: 1, profile: { name: 'John', age: 30 } },
                items: [1, 2, 3],
                metadata: { created: new Date().toISOString() },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(complexData));

            const result = await CacheService.get('complex-key');

            expect(result).toEqual(complexData);
        });
    });

    describe('set', () => {
        it('should set data with default TTL', async () => {
            const testData = { id: 1, name: 'Test' };
            mockRedisClient.setEx.mockResolvedValue('OK');

            await CacheService.set('test-key', testData);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                'test-key',
                300, // default TTL
                JSON.stringify(testData)
            );
        });

        it('should set data with custom TTL', async () => {
            const testData = { id: 1 };
            const customTTL = 600;
            mockRedisClient.setEx.mockResolvedValue('OK');

            await CacheService.set('test-key', testData, customTTL);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                'test-key',
                customTTL,
                JSON.stringify(testData)
            );
        });

        it('should handle primitive values', async () => {
            mockRedisClient.setEx.mockResolvedValue('OK');

            await CacheService.set('string-key', 'test-string');
            await CacheService.set('number-key', 42);
            await CacheService.set('boolean-key', true);

            expect(mockRedisClient.setEx).toHaveBeenCalledTimes(3);
        });

        it('should log error on Redis failure but not throw', async () => {
            mockRedisClient.setEx.mockRejectedValue(new Error('Redis write error'));

            await expect(CacheService.set('error-key', { data: 'test' })).resolves.not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                'Cache set error:',
                expect.any(Error)
            );
        });
    });

    describe('del', () => {
        it('should delete key successfully', async () => {
            mockRedisClient.del.mockResolvedValue(1);

            await CacheService.del('test-key');

            expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
        });

        it('should handle deletion of non-existent key', async () => {
            mockRedisClient.del.mockResolvedValue(0);

            await expect(CacheService.del('missing-key')).resolves.not.toThrow();
        });

        it('should log error on Redis failure but not throw', async () => {
            mockRedisClient.del.mockRejectedValue(new Error('Redis delete error'));

            await expect(CacheService.del('error-key')).resolves.not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                'Cache delete error:',
                expect.any(Error)
            );
        });
    });

    describe('invalidatePattern', () => {
        it('should delete all keys matching pattern', async () => {
            const matchingKeys = ['user:1', 'user:2', 'user:3'];
            mockRedisClient.keys.mockResolvedValue(matchingKeys);
            mockRedisClient.del.mockResolvedValue(3);

            await CacheService.invalidatePattern('user:*');

            expect(mockRedisClient.keys).toHaveBeenCalledWith('user:*');
            expect(mockRedisClient.del).toHaveBeenCalledWith(matchingKeys);
        });

        it('should handle no matching keys gracefully', async () => {
            mockRedisClient.keys.mockResolvedValue([]);

            await CacheService.invalidatePattern('nonexistent:*');

            expect(mockRedisClient.keys).toHaveBeenCalledWith('nonexistent:*');
            expect(mockRedisClient.del).not.toHaveBeenCalled();
        });

        it('should log error on Redis failure but not throw', async () => {
            mockRedisClient.keys.mockRejectedValue(new Error('Redis keys error'));

            await expect(CacheService.invalidatePattern('error:*')).resolves.not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                'Cache invalidate pattern error:',
                expect.any(Error)
            );
        });

        it('should handle pattern with special characters', async () => {
            const pattern = 'product:category:[*]:items';
            mockRedisClient.keys.mockResolvedValue(['product:category:[electronics]:items']);
            mockRedisClient.del.mockResolvedValue(1);

            await CacheService.invalidatePattern(pattern);

            expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
        });
    });
});

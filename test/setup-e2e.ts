// E2E Test Setup
// This file runs before all e2e tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.REDIS_CACHE_TTL = '60';

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
    // Add any global cleanup here
    await new Promise(resolve => setTimeout(resolve, 500));
});

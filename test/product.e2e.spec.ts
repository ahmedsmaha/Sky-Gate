import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes';
import { ErrorHandlerMiddleware } from '../src/middleware/errorHandler.middleware';
import { db, prisma } from '../src/config/database';
import { redisService } from '../src/config/redis';

// Create test express app
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    ErrorHandlerMiddleware.handle(err, req, res, _next);
});

describe('Product API E2E Tests', () => {
    let createdProductId: number;
    const testSKU = `TEST-SKU-${Date.now()}`;

    beforeAll(async () => {
        // Initialize connections
        await db.getClient();
        await redisService.getClient();
    });

    afterAll(async () => {
        // Clean up test data
        if (createdProductId) {
            await prisma.product.deleteMany({
                where: { sku: { startsWith: 'TEST-SKU-' } },
            });
        }

        // Disconnect
        await db.disconnect();
        await redisService.disconnect();
    });

    describe('POST /api/products', () => {
        it('should create a new product', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Test Product',
                    description: 'Test Description',
                    price: 99.99,
                    quantity: 10,
                    category: 'Electronics',
                    type: 'public',
                    sku: testSKU,
                    discountPrice: null,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Product created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('Test Product');
            expect(response.body.data.sku).toBe(testSKU);

            createdProductId = response.body.data.id;
        });

        it('should reject duplicate SKU', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Duplicate Product',
                    description: 'Test',
                    price: 50,
                    quantity: 5,
                    category: 'Electronics',
                    type: 'public',
                    sku: testSKU, // Same SKU
                    discountPrice: null,
                })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CONFLICT');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Invalid Product',
                    // Missing required fields
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should validate price is positive', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Negative Price Product',
                    description: 'Test',
                    price: -10, // Invalid negative price
                    quantity: 5,
                    category: 'Electronics',
                    type: 'public',
                    sku: `TEST-NEG-${Date.now()}`,
                    discountPrice: null,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should create product with discount price', async () => {
            const sku = `TEST-DISC-${Date.now()}`;
            const response = await request(app)
                .post('/api/products')
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Discounted Product',
                    description: 'Test',
                    price: 100,
                    quantity: 5,
                    category: 'Electronics',
                    type: 'public',
                    sku,
                    discountPrice: 80,
                })
                .expect(201);

            expect(response.body.data.discountPrice).toBeDefined();

            // Clean up
            await prisma.product.delete({ where: { id: response.body.data.id } });
        });
    });

    describe('GET /api/products', () => {
        it('should get all products with pagination as admin', async () => {
            const response = await request(app)
                .get('/api/products?page=1&limit=10')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.currentPage).toBe(1);
        });

        it('should filter products by category', async () => {
            const response = await request(app)
                .get('/api/products?category=Electronics')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach((product: { category: string }) => {
                expect(product.category).toBe('Electronics');
            });
        });

        it('should filter products by price range', async () => {
            const response = await request(app)
                .get('/api/products?minPrice=50&maxPrice=150')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should search products by name', async () => {
            const response = await request(app)
                .get('/api/products?search=Test')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should only show public products for regular users', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('X-User-Role', 'user')
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach((product: { type: string }) => {
                expect(product.type).toBe('PUBLIC');
            });
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by ID', async () => {
            const response = await request(app)
                .get(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(createdProductId);
            expect(response.body.data.sku).toBe(testSKU);
        });

        it('should return 404 for non-existent product', async () => {
            const response = await request(app)
                .get('/api/products/999999')
                .set('X-User-Role', 'admin')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });

        it('should deny access to private products for regular users', async () => {
            // First create a private product
            const privateProduct = await prisma.product.create({
                data: {
                    name: 'Private Product',
                    description: 'Private',
                    price: 100,
                    quantity: 5,
                    category: 'Electronics',
                    type: 'PRIVATE',
                    sku: `TEST-PRIV-${Date.now()}`,
                },
            });

            const response = await request(app)
                .get(`/api/products/${privateProduct.id}`)
                .set('X-User-Role', 'user')
                .expect(404);

            expect(response.body.success).toBe(false);

            // Clean up
            await prisma.product.delete({ where: { id: privateProduct.id } });
        });
    });

    describe('PATCH /api/products/:id', () => {
        it('should update product', async () => {
            const response = await request(app)
                .patch(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .send({
                    name: 'Updated Test Product',
                    price: 149.99,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Test Product');
        });

        it('should return 404 when updating non-existent product', async () => {
            const response = await request(app)
                .patch('/api/products/999999')
                .set('X-User-Role', 'admin')
                .send({ name: 'Updated' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should prevent updating to duplicate SKU', async () => {
            // Create another product
            const anotherProduct = await prisma.product.create({
                data: {
                    name: 'Another Product',
                    description: 'Test',
                    price: 50,
                    quantity: 5,
                    category: 'Electronics',
                    type: 'PUBLIC',
                    sku: `TEST-OTHER-${Date.now()}`,
                },
            });

            const response = await request(app)
                .patch(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .send({ sku: anotherProduct.sku })
                .expect(409);

            expect(response.body.success).toBe(false);

            // Clean up
            await prisma.product.delete({ where: { id: anotherProduct.id } });
        });

        it('should update discount price', async () => {
            const response = await request(app)
                .patch(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .send({ discountPrice: 99.99 })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should clear discount price when set to null', async () => {
            const response = await request(app)
                .patch(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .send({ discountPrice: null })
                .send({ discountPrice: null })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.discountPrice).toBeNull();
        });
    });

    describe('GET /api/products/stats', () => {
        it('should get product statistics', async () => {
            const response = await request(app)
                .get('/api/products/stats')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalProducts');
            expect(response.body.data).toHaveProperty('totalInventoryValue');
            expect(response.body.data).toHaveProperty('averagePrice');
            expect(response.body.data).toHaveProperty('outOfStockCount');
            expect(response.body.data).toHaveProperty('productsByCategory');
            expect(response.body.data).toHaveProperty('productsByType');
        });

        it('should cache statistics', async () => {
            // First request
            const response1 = await request(app)
                .get('/api/products/stats')
                .set('X-User-Role', 'admin')
                .expect(200);

            // Second request (should come from cache)
            const response2 = await request(app)
                .get('/api/products/stats')
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response1.body.data).toEqual(response2.body.data);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product', async () => {
            const response = await request(app)
                .delete(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Product deleted successfully');

            // Verify product is deleted
            const getResponse = await request(app)
                .get(`/api/products/${createdProductId}`)
                .set('X-User-Role', 'admin')
                .expect(404);

            expect(getResponse.body.success).toBe(false);

            createdProductId = 0; // Reset so we don't try to delete in afterAll
        });

        it('should return 404 when deleting non-existent product', async () => {
            const response = await request(app)
                .delete('/api/products/999999')
                .set('X-User-Role', 'admin')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle invalid ID parameter', async () => {
            const response = await request(app)
                .get('/api/products/invalid-id')
                .set('X-User-Role', 'admin');

            // Depending on implementation, this might be 400 or 404
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.body.success).toBe(false);
        });
    });
});

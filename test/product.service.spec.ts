import 'reflect-metadata';
import { ProductService } from '../src/services/product.service';
import { CacheService } from '../src/services/cache.service';
import { prisma } from '../src/config/database';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../src/dto/product.dto';
import { NotFoundError, ConflictError } from '../src/utils/errors';
import { Prisma, ProductType } from '../src/generated/prisma/client';

// Mock the dependencies
jest.mock('../src/config/database', () => ({
    __esModule: true,
    prisma: {
        product: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            aggregate: jest.fn(),
        },
    },
    db: {
        getClient: jest.fn(),
        disconnect: jest.fn(),
    },
}));

jest.mock('../src/services/cache.service');

describe('ProductService', () => {
    let productService: ProductService;
    const mockPrisma = prisma as jest.Mocked<typeof prisma> & {
        product: {
            findUnique: jest.MockedFunction<typeof prisma.product.findUnique>;
            create: jest.MockedFunction<typeof prisma.product.create>;
            findMany: jest.MockedFunction<typeof prisma.product.findMany>;
            count: jest.MockedFunction<typeof prisma.product.count>;
            update: jest.MockedFunction<typeof prisma.product.update>;
            delete: jest.MockedFunction<typeof prisma.product.delete>;
            findFirst: jest.MockedFunction<typeof prisma.product.findFirst>;
            aggregate: jest.MockedFunction<typeof prisma.product.aggregate>;
        };
    };
    const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

    beforeEach(() => {
        productService = new ProductService();
        jest.clearAllMocks();
    });

    describe('createProduct', () => {
        const validProductDto: CreateProductDto = {
            name: 'Test Product',
            description: 'Test Description',
            price: 99.99,
            quantity: 10,
            category: 'Electronics',
            type: 'public',
            sku: 'TEST-SKU-001',
            discountPrice: undefined,
        };

        it('should create a product successfully', async () => {
            const mockProduct = {
                id: 1,
                sku: validProductDto.sku,
                name: validProductDto.name,
                description: validProductDto.description ?? null,
                category: validProductDto.category,
                quantity: validProductDto.quantity,
                type: ProductType.PUBLIC,
                price: new Prisma.Decimal('99.99'),
                discountPrice: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.product.findUnique.mockResolvedValue(null);
            mockPrisma.product.create.mockResolvedValue(mockProduct);

            const result = await productService.createProduct(validProductDto);

            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
                where: { sku: validProductDto.sku },
            });
            expect(mockPrisma.product.create).toHaveBeenCalled();
            expect(result).toEqual(mockProduct);
        });

        it('should throw ConflictError if SKU already exists', async () => {
            const existingProduct = {
                id: 1,
                sku: validProductDto.sku,
                name: 'Existing Product',
                description: 'Existing Description',
                category: 'Electronics',
                quantity: 5,
                type: ProductType.PUBLIC,
                price: new Prisma.Decimal('50.00'),
                discountPrice: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

            await expect(productService.createProduct(validProductDto)).rejects.toThrow(ConflictError);
            expect(mockPrisma.product.create).not.toHaveBeenCalled();
        });

        it('should convert type string to enum correctly', async () => {
            const privateProduct = { ...validProductDto, type: 'private' as const };
            mockPrisma.product.findUnique.mockResolvedValue(null);
            mockPrisma.product.create.mockResolvedValue({
                id: 1,
                sku: privateProduct.sku,
                name: privateProduct.name,
                description: privateProduct.description ?? null,
                category: privateProduct.category,
                quantity: privateProduct.quantity,
                price: new Prisma.Decimal(privateProduct.price),
                discountPrice: null,
                type: ProductType.PRIVATE,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await productService.createProduct(privateProduct);

            const createCall = mockPrisma.product.create.mock.calls[0][0];
            expect(createCall.data.type).toBe('PRIVATE');
        });

        it('should invalidate cache after creating product', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);
            mockPrisma.product.create.mockResolvedValue({
                id: 1,
                sku: validProductDto.sku,
                name: validProductDto.name,
                description: validProductDto.description ?? null,
                category: validProductDto.category,
                quantity: validProductDto.quantity,
                price: new Prisma.Decimal(validProductDto.price),
                discountPrice: null,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await productService.createProduct(validProductDto);

            expect(mockCacheService.del).toHaveBeenCalled();
        });
    });

    describe('getAllProducts', () => {
        const mockProducts = [
            {
                id: 1,
                sku: 'MOCK-SKU-1',
                name: 'Product 1',
                description: null,
                category: 'Electronics',
                quantity: 10,
                type: ProductType.PUBLIC,
                price: new Prisma.Decimal('50'),
                discountPrice: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 2,
                sku: 'MOCK-SKU-2',
                name: 'Product 2',
                description: null,
                category: 'Electronics',
                quantity: 5,
                type: ProductType.PRIVATE,
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        it('should return paginated products for admin', async () => {
            const query: ProductQueryDto = { page: 1, limit: 10 };
            mockPrisma.product.count.mockResolvedValue(2);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);

            const result = await productService.getAllProducts(query, 'admin');

            expect(result.products).toEqual(mockProducts);
            expect(result.pagination.totalCount).toBe(2);
            expect(result.pagination.currentPage).toBe(1);
        });

        it('should filter private products for regular users', async () => {
            const query: ProductQueryDto = { page: 1, limit: 10 };
            mockPrisma.product.count.mockResolvedValue(1);
            mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);

            await productService.getAllProducts(query, 'user');

            const whereClause = mockPrisma.product.findMany.mock.calls[0][0]!.where;
            expect(whereClause?.type).toBe('PUBLIC');
        });

        it('should apply search filter', async () => {
            const query: ProductQueryDto = { page: 1, limit: 10, search: 'test' };
            mockPrisma.product.count.mockResolvedValue(0);
            mockPrisma.product.findMany.mockResolvedValue([]);

            await productService.getAllProducts(query, 'admin');

            const whereClause = mockPrisma.product.findMany.mock.calls[0][0]!.where;
            expect(whereClause?.OR).toBeDefined();
        });

        it('should apply price range filter', async () => {
            const query: ProductQueryDto = { page: 1, limit: 10, minPrice: 10, maxPrice: 100 };
            mockPrisma.product.count.mockResolvedValue(0);
            mockPrisma.product.findMany.mockResolvedValue([]);

            await productService.getAllProducts(query, 'admin');

            const whereClause = mockPrisma.product.findMany.mock.calls[0][0]!.where;
            expect(whereClause?.price).toBeDefined();
        });

        it('should calculate pagination metadata correctly', async () => {
            const query: ProductQueryDto = { page: 2, limit: 5 };
            mockPrisma.product.count.mockResolvedValue(12);
            mockPrisma.product.findMany.mockResolvedValue([]);

            const result = await productService.getAllProducts(query, 'admin');

            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPreviousPage).toBe(true);
        });
    });

    describe('getProductById', () => {
        const mockProduct = {
            id: 1,
            sku: 'TEST-SKU',
            name: 'Test Product',
            description: null,
            category: 'Electronics',
            price: new Prisma.Decimal('100'),
            discountPrice: null,
            quantity: 10,
            type: ProductType.PUBLIC,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should return product for admin', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

            const result = await productService.getProductById(1, 'admin');

            expect(result).toEqual(mockProduct);
        });

        it('should return public product for regular user', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

            const result = await productService.getProductById(1, 'user');

            expect(result).toEqual(mockProduct);
        });

        it('should throw NotFoundError for private product accessed by user', async () => {
            const privateProduct = { ...mockProduct, type: ProductType.PRIVATE };
            mockPrisma.product.findUnique.mockResolvedValue(privateProduct);

            await expect(productService.getProductById(1, 'user')).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if product does not exist', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(productService.getProductById(999, 'admin')).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateProduct', () => {
        const updateDto: UpdateProductDto = {
            name: 'Updated Product',
            price: 149.99,
        };

        it('should update product successfully', async () => {
            const existingProduct = {
                id: 1,
                sku: 'TEST-SKU',
                name: 'Old Name',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const updatedProduct = {
                ...existingProduct,
                name: updateDto.name!,
                price: new Prisma.Decimal(updateDto.price!),
            };

            mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
            mockPrisma.product.update.mockResolvedValue(updatedProduct);

            const result = await productService.updateProduct(1, updateDto);

            expect(mockPrisma.product.update).toHaveBeenCalled();
            expect(result).toEqual(updatedProduct);
        });

        it('should throw NotFoundError if product does not exist', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(productService.updateProduct(999, updateDto)).rejects.toThrow(NotFoundError);
        });

        it('should throw ConflictError if updating to existing SKU', async () => {
            const existingProduct = {
                id: 1,
                sku: 'OLD-SKU',
                name: 'Product',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const conflictingProduct = {
                id: 2,
                sku: 'NEW-SKU',
                name: 'Product',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
            mockPrisma.product.findFirst.mockResolvedValue(conflictingProduct);

            await expect(
                productService.updateProduct(1, { sku: 'NEW-SKU' })
            ).rejects.toThrow(ConflictError);
        });

        it('should invalidate cache after update', async () => {
            const mockProduct = {
                id: 1,
                sku: 'TEST-SKU',
                name: 'Product',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockUpdatedProduct = {
                ...mockProduct,
                name: updateDto.name!,
                price: new Prisma.Decimal(updateDto.price!),
            };
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
            mockPrisma.product.update.mockResolvedValue(mockUpdatedProduct);

            await productService.updateProduct(1, updateDto);

            expect(mockCacheService.del).toHaveBeenCalled();
        });
    });

    describe('deleteProduct', () => {
        it('should delete product successfully', async () => {
            const mockProduct = {
                id: 1,
                sku: 'TEST-SKU',
                name: 'Product',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
            mockPrisma.product.delete.mockResolvedValue(mockProduct);

            await productService.deleteProduct(1);

            expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should throw NotFoundError if product does not exist', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(productService.deleteProduct(999)).rejects.toThrow(NotFoundError);
        });

        it('should invalidate cache after deletion', async () => {
            const mockProduct = {
                id: 1,
                sku: 'TEST-SKU',
                name: 'Product',
                description: null,
                category: 'Electronics',
                price: new Prisma.Decimal('100'),
                discountPrice: null,
                quantity: 10,
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
            mockPrisma.product.delete.mockResolvedValue(mockProduct);

            await productService.deleteProduct(1);

            expect(mockCacheService.del).toHaveBeenCalled();
        });
    });

    describe('getStatistics', () => {
        const mockProducts = [
            {
                id: 1,
                sku: 'MOCK-SKU-1',
                name: 'Product 1',
                description: null,
                discountPrice: null,
                price: new Prisma.Decimal('100'),
                quantity: 5,
                category: 'Electronics',
                type: ProductType.PUBLIC,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 2,
                sku: 'MOCK-SKU-2',
                name: 'Product 2',
                description: null,
                discountPrice: null,
                price: new Prisma.Decimal('50'),
                quantity: 0,
                category: 'Electronics',
                type: ProductType.PRIVATE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        it('should return cached statistics if available', async () => {
            const cachedStats = {
                totalProducts: 2,
                totalInventoryValue: 500,
                averagePrice: 75,
                outOfStockCount: 1,
                productsByCategory: {},
                productsByType: {},
            };

            mockCacheService.get.mockResolvedValue(cachedStats);

            const result = await productService.getStatistics();

            expect(result).toEqual(cachedStats);
            expect(mockPrisma.product.count).not.toHaveBeenCalled();
        });

        it('should calculate statistics when cache is empty', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPrisma.product.count.mockResolvedValue(2);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            mockPrisma.product.aggregate.mockResolvedValue({
                _count: { _all: 0 },
                _avg: { quantity: null, price: null },
                _min: { quantity: null },
                _max: { quantity: null },
                _sum: { quantity: 5 }
            });

            const result = await productService.getStatistics();

            expect(result.totalProducts).toBe(2);
            expect(result.outOfStockCount).toBe(1);
            expect(mockCacheService.set).toHaveBeenCalled();
        });

        it('should group products by category', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPrisma.product.count.mockResolvedValue(2);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            mockPrisma.product.aggregate.mockResolvedValue({
                _count: { _all: 0 },
                _avg: { quantity: null, price: null },
                _min: { quantity: null },
                _max: { quantity: null },
                _sum: { quantity: 5 }
            });

            const result = await productService.getStatistics();

            expect(result.productsByCategory.Electronics).toBeDefined();
            expect(result.productsByCategory.Electronics.count).toBe(2);
        });

        it('should group products by type', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPrisma.product.count.mockResolvedValue(2);
            mockPrisma.product.findMany.mockResolvedValue(mockProducts);
            mockPrisma.product.aggregate.mockResolvedValue({
                _count: { _all: 0 },
                _avg: { quantity: null, price: null },
                _min: { quantity: null },
                _max: { quantity: null },
                _sum: { quantity: 5 }
            });

            const result = await productService.getStatistics();

            expect(result.productsByType.public).toBeDefined();
            expect(result.productsByType.private).toBeDefined();
        });
    });
});

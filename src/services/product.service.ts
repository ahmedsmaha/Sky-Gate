import { Product, Prisma } from '../generated/prisma/client';
import { prisma } from '../config/database';
import { UserRole, PaginationMeta } from '../types/response.types';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dto/product.dto';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CacheService } from './cache.service';

interface CategoryStats {
    count: number;
    totalValue: number;
}

interface TypeStats {
    count: number;
    totalValue: number;
}

interface ProductStatistics {
    totalProducts: number;
    totalInventoryValue: number;
    averagePrice: number;
    outOfStockCount: number;
    productsByCategory: Record<string, CategoryStats>;
    productsByType: Record<string, TypeStats>;
}

export class ProductService {
    private static readonly STATS_CACHE_KEY = 'product:stats';
    async createProduct(data: CreateProductDto): Promise<Product> {
        // Check for duplicate SKU
        const existing = await prisma.product.findUnique({
            where: { sku: data.sku },
        });

        if (existing) {
            throw new ConflictError('Product with this SKU already exists', {
                field: 'sku',
                value: data.sku,
            });
        }

        // Map type string to enum
        const productData: Prisma.ProductCreateInput = {
            ...data,
            type: data.type === 'private' ? 'PRIVATE' : 'PUBLIC',
            price: new Prisma.Decimal(data.price),
            discountPrice: data.discountPrice ? new Prisma.Decimal(data.discountPrice) : null,
        };

        const product = await prisma.product.create({
            data: productData,
        });

        await this.invalidateStatsCache();

        return product;
    }

    async getAllProducts(
        query: ProductQueryDto,
        userRole: UserRole
    ): Promise<{ products: Product[]; pagination: PaginationMeta }> {
        const { page = 1, limit = 10, category, minPrice, maxPrice, search } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {};

        if (userRole === 'user') {
            where.type = 'PUBLIC';
        }

        if (category) {
            where.category = category;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) {
                where.price.gte = new Prisma.Decimal(minPrice);
            }
            if (maxPrice !== undefined) {
                where.price.lte = new Prisma.Decimal(maxPrice);
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [totalCount, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        const pagination: PaginationMeta = {
            currentPage: page,
            totalPages,
            pageSize: limit,
            totalCount,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };

        return { products, pagination };
    }

    async getProductById(id: number, userRole: UserRole): Promise<Product> {
        if (!id || Number.isNaN(id)) {
            throw new NotFoundError('Product not found', { resource: 'Product', id: String(id) });
        }

        const product = await prisma.product.findUnique({
            where: { id: id },
        });

        if (!product) {
            throw new NotFoundError('Product not found', {
                resource: 'Product',
                id: id.toString(),
            });
        }

        // Users can only access public products
        if (userRole === 'user' && product.type === 'PRIVATE') {
            throw new NotFoundError('Product not found', {
                resource: 'Product',
                id: id.toString(),
            });
        }

        return product;
    }

    async updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
        await this.getProductById(id, 'admin');

        if (data.sku) {
            const existing = await prisma.product.findFirst({
                where: {
                    sku: data.sku,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new ConflictError('Product with this SKU already exists', {
                    field: 'sku',
                    value: data.sku,
                });
            }
        }

        let mappedType: 'PRIVATE' | 'PUBLIC' | undefined = undefined;
        if (data.type) {
            mappedType = data.type === 'private' ? 'PRIVATE' : 'PUBLIC';
        }

        let discountPriceValue: Prisma.Decimal | null | undefined = undefined;
        if (data.discountPrice !== undefined) {
            discountPriceValue = data.discountPrice === null
                ? null
                : new Prisma.Decimal(data.discountPrice);
        }

        const updateData: Prisma.ProductUpdateInput = {
            ...data,
            type: mappedType,
            price: data.price ? new Prisma.Decimal(data.price) : undefined,
            discountPrice: discountPriceValue,
        };

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        await this.invalidateStatsCache();

        return product;
    }

    async deleteProduct(id: number): Promise<void> {
        await this.getProductById(id, 'admin');

        await prisma.product.delete({
            where: { id },
        });

        await this.invalidateStatsCache();
    }

    async getStatistics(): Promise<ProductStatistics> {
        const cached = await CacheService.get(ProductService.STATS_CACHE_KEY) as ProductStatistics | null;
        if (cached) {
            return cached;
        }

        const [totalProducts, products] = await Promise.all([
            prisma.product.count(),
            prisma.product.findMany({
                select: {
                    price: true,
                    quantity: true,
                    category: true,
                    type: true,
                },
            }),
            prisma.product.aggregate({
                _sum: {
                    quantity: true,
                },
            }),
        ]);

        const totalInventoryValue = products.reduce((sum: number, p) => {
            return sum + Number.parseFloat(p.price.toString()) * p.quantity;
        }, 0);
        const averagePrice = totalProducts > 0
            ? totalInventoryValue / totalProducts
            : 0;

        const outOfStockCount = products.filter((p) => p.quantity === 0).length;

        const productsByCategory = products.reduce((acc: Record<string, CategoryStats>, p) => {
            const category = p.category;
            if (!acc[category]) {
                acc[category] = { count: 0, totalValue: 0 };
            }
            acc[category].count++;
            acc[category].totalValue += Number.parseFloat(p.price.toString()) * p.quantity;
            return acc;
        }, {});

        const productsByType = products.reduce((acc: Record<string, TypeStats>, p) => {
            const type = p.type.toLowerCase();
            if (!acc[type]) {
                acc[type] = { count: 0, totalValue: 0 };
            }
            acc[type].count++;
            acc[type].totalValue += Number.parseFloat(p.price.toString()) * p.quantity;
            return acc;
        }, {});

        const stats = {
            totalProducts,
            totalInventoryValue: Number.parseFloat(totalInventoryValue.toFixed(2)),
            averagePrice: Number.parseFloat(averagePrice.toFixed(2)),
            outOfStockCount,
            productsByCategory,
            productsByType,
        };

        await CacheService.set(ProductService.STATS_CACHE_KEY, stats);

        return stats;
    }

    private async invalidateStatsCache(): Promise<void> {
        await CacheService.del(ProductService.STATS_CACHE_KEY);
    }
}

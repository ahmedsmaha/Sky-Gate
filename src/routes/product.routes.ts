import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { RbacMiddleware } from '../middleware/rbac.middleware';
import { AuthorizeMiddleware } from '../middleware/authorize.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dto/product.dto';

const router = Router();
const productController = new ProductController();

// Apply RBAC middleware to all product routes
router.use(RbacMiddleware.check);

// POST /api/products - Create product (Admin only)
router.post(
    '/',
    (req, res, next) => AuthorizeMiddleware.check(req, res, next, ['admin']),
    (req, res, next) => ValidationMiddleware.validate(req, res, next, CreateProductDto, 'body'),
    productController.createProduct.bind(productController)
);

// GET /api/products/stats - Get statistics (Admin only)
// IMPORTANT: This must come before /:id route to avoid conflicts
router.get(
    '/stats',
    (req, res, next) => AuthorizeMiddleware.check(req, res, next, ['admin']),
    productController.getStatistics.bind(productController)
);

// GET /api/products - List products (Admin & User)
router.get(
    '/',
    (req, res, next) => ValidationMiddleware.validate(req, res, next, ProductQueryDto, 'query'),
    productController.getAllProducts.bind(productController)
);

// GET /api/products/:id - Get single product (Admin & User with access control)
router.get(
    '/:id',
    productController.getProductById.bind(productController)
);

// PUT /api/products/:id - Update product (Admin only)
router.put(
    '/:id',
    (req, res, next) => AuthorizeMiddleware.check(req, res, next, ['admin']),
    (req, res, next) => ValidationMiddleware.validate(req, res, next, UpdateProductDto, 'body'),
    productController.updateProduct.bind(productController)
);

// PATCH /api/products/:id - Update product (Admin only)
router.patch(
    '/:id',
    (req, res, next) => AuthorizeMiddleware.check(req, res, next, ['admin']),
    (req, res, next) => ValidationMiddleware.validate(req, res, next, UpdateProductDto, 'body'),
    productController.updateProduct.bind(productController)
);

// DELETE /api/products/:id - Delete product (Admin only)
router.delete(
    '/:id',
    (req, res, next) => AuthorizeMiddleware.check(req, res, next, ['admin']),
    productController.deleteProduct.bind(productController)
);

export default router;

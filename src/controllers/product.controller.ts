import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../types/request.types';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dto/product.dto';
import { successResponse } from '../utils/response.helper';

const productService = new ProductService();

export class ProductController {
    async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = req.body as CreateProductDto;
            const product = await productService.createProduct(data);

            successResponse(res, product, 'Product created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllProducts(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.body as ProductQueryDto;
            const userRole = req.userRole!;

            const { products, pagination } = await productService.getAllProducts(query, userRole);

            successResponse(res, products, 'Products retrieved successfully', 200, pagination);
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number.parseInt(req.params.id);
            const userRole = req.userRole!;

            const product = await productService.getProductById(id, userRole);

            successResponse(res, product, 'Product retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number.parseInt(req.params.id);
            const data = req.body as UpdateProductDto;

            const product = await productService.updateProduct(id, data);

            successResponse(res, product, 'Product updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number.parseInt(req.params.id);

            await productService.deleteProduct(id);

            successResponse(res, null, 'Product deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await productService.getStatistics();

            successResponse(res, stats, 'Statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

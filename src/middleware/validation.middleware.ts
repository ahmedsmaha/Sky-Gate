import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError as ClassValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationError } from '../utils/errors';

/**
 * Unified validation middleware
 * @param dtoClass - The DTO class to validate against
 * @param source - The source to validate from: 'body' for req.body or 'query' for req.query
 */
export class ValidationMiddleware {
    static async validate(
        req: Request,
        _: Response,
        next: NextFunction,
        dtoClass: new (...args: unknown[]) => object,
        source: 'body' | 'query' = 'body'
    ): Promise<void> {
        try {
            const dataToValidate = source === 'body' ? req.body : req.query;

            const dtoInstance = plainToInstance(dtoClass, dataToValidate);
            const errors = await validate(dtoInstance);

            if (errors.length > 0) {
                const formattedErrors = errors.map((error: ClassValidationError) => ({
                    field: error.property,
                    message: Object.values(error.constraints || {})[0] || 'Validation failed',
                }));

                throw new ValidationError('Validation failed', formattedErrors);
            }

            req.body = dtoInstance;
            next();
        } catch (error) {
            next(error);
        }
    }
}

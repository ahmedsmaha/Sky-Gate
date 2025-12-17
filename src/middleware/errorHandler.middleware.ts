import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response.helper';
import { Prisma } from '../generated/prisma/client';

/**
 * Middleware to handle errors
 * @param error - The error object
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export class ErrorHandlerMiddleware {
    static handle(
        error: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): Response | void {

        if (error instanceof AppError) {
            return errorResponse(res, error.message, error.code, error.statusCode, error.details);
        }

        if (error.name === 'ValidationError') {
            return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, error.message);
        }

        if (error instanceof SyntaxError && 'status' in error && (error as { status: number }).status === 400) {
            return errorResponse(res, 'Invalid JSON format', 'VALIDATION_ERROR', 400);
        }

        return errorResponse(
            res,
            'An unexpected error occurred',
            'INTERNAL_SERVER_ERROR',
            500,
            process.env.NODE_ENV === 'development' ? error.message : undefined
        );
    }
}

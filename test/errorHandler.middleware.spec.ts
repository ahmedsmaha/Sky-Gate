import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { ErrorHandlerMiddleware } from '../src/middleware/errorHandler.middleware';
import { ValidationError, NotFoundError, ConflictError, UnauthorizedError } from '../src/utils/errors';

describe('ErrorHandler Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let _next: NextFunction;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockRequest = {};
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };

        _next = jest.fn() as NextFunction;

        // Suppress console.error during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('ValidationError', () => {
        it('should handle ValidationError with 400 status', () => {
            const error = new ValidationError('Validation failed', [
                { field: 'name', message: 'Name is required' },
            ]);

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                error: {
                    code: 'VALIDATION_ERROR',
                    details: [{ field: 'name', message: 'Name is required' }],
                },
            });
        });

        it('should handle ValidationError with multiple errors', () => {
            const error = new ValidationError('Multiple validation errors', [
                { field: 'name', message: 'Name is required' },
                { field: 'email', message: 'Invalid email format' },
                { field: 'age', message: 'Age must be positive' },
            ]);

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        details: expect.arrayContaining([
                            { field: 'name', message: 'Name is required' },
                            { field: 'email', message: 'Invalid email format' },
                            { field: 'age', message: 'Age must be positive' },
                        ]),
                    }),
                })
            );
        });
    });

    describe('NotFoundError', () => {
        it('should handle NotFoundError with 404 status', () => {
            const error = new NotFoundError('Product not found', {
                resource: 'Product',
                id: '123',
            });

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Product not found',
                error: {
                    code: 'NOT_FOUND',
                    details: {
                        resource: 'Product',
                        id: '123',
                    },
                },
            });
        });
    });

    describe('ConflictError', () => {
        it('should handle ConflictError with 409 status', () => {
            const error = new ConflictError('Product with this SKU already exists', {
                field: 'sku',
                value: 'TEST-SKU-001',
            });

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Product with this SKU already exists',
                error: {
                    code: 'CONFLICT',
                    details: {
                        field: 'sku',
                        value: 'TEST-SKU-001',
                    },
                },
            });
        });
    });

    describe('UnauthorizedError', () => {
        it('should handle UnauthorizedError with 401 status', () => {
            const error = new UnauthorizedError('Invalid credentials');

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid credentials',
                error: {
                    code: 'UNAUTHORIZED',
                },
            });
        });
    });

    describe('Prisma Errors', () => {
        it('should handle Prisma unique constraint violation', () => {
            const error = {
                name: 'PrismaClientKnownRequestError',
                code: 'P2002',
                message: 'Unique constraint failed',
                meta: { target: ['sku'] },
            };

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'A record with this value already exists',
                    error: expect.objectContaining({
                        code: 'DUPLICATE_RECORD',
                    }),
                })
            );
        });

        it('should handle Prisma record not found error', () => {
            const error = {
                name: 'PrismaClientKnownRequestError',
                code: 'P2025',
                message: 'Record not found',
            };

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Record not found',
                    error: expect.objectContaining({
                        code: 'NOT_FOUND',
                    }),
                })
            );
        });
    });

    describe('Generic Errors', () => {
        it('should handle generic Error with 500 status', () => {
            const error = new Error('Something went wrong');

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                "message": "An unexpected error occurred",
                error: {
                    "code": "INTERNAL_SERVER_ERROR",
                    "details": undefined,
                },
            });
        });


    });

    describe('Non-Error objects', () => {
        it('should handle string errors', () => {
            const error = new Error('Something went wrong');

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(500);
        });

        it('should handle null/undefined errors', () => {
            const error = new Error('Unknown error');

            ErrorHandlerMiddleware.handle(error, mockRequest as Request, mockResponse as Response, _next as NextFunction);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});

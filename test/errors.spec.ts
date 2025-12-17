import {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
} from '../src/utils/errors';

describe('Custom Error Classes', () => {
    describe('AppError', () => {
        it('should create an AppError with all properties', () => {
            const error = new AppError('Test error', 500, 'TEST_ERROR', { detail: 'extra info' });

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ detail: 'extra info' });
            expect(error.name).toBe('AppError');
        });

        it('should be instance of Error', () => {
            const error = new AppError('Test', 500, 'TEST');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
        });

        it('should capture stack trace', () => {
            const error = new AppError('Test', 500, 'TEST');

            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('ValidationError', () => {
        it('should create ValidationError with default message', () => {
            const error = new ValidationError();

            expect(error.message).toBe('Validation failed');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
        });

        it('should create ValidationError with custom message', () => {
            const error = new ValidationError('Custom validation message');

            expect(error.message).toBe('Custom validation message');
            expect(error.statusCode).toBe(400);
        });

        it('should include validation details', () => {
            const details = [
                { field: 'name', message: 'Name is required' },
                { field: 'email', message: 'Invalid email' },
            ];
            const error = new ValidationError('Validation failed', details);

            expect(error.details).toEqual(details);
        });

        it('should be instance of AppError', () => {
            const error = new ValidationError();

            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(ValidationError);
        });
    });

    describe('UnauthorizedError', () => {
        it('should create UnauthorizedError with default message', () => {
            const error = new UnauthorizedError();

            expect(error.message).toBe('Authentication required');
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should create UnauthorizedError with custom message', () => {
            const error = new UnauthorizedError('Invalid credentials');

            expect(error.message).toBe('Invalid credentials');
        });

        it('should include details', () => {
            const error = new UnauthorizedError('Token expired', { token: 'xyz' });

            expect(error.details).toEqual({ token: 'xyz' });
        });
    });

    describe('ForbiddenError', () => {
        it('should create ForbiddenError with default message', () => {
            const error = new ForbiddenError();

            expect(error.message).toBe('You do not have permission to perform this action');
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('FORBIDDEN');
        });

        it('should create ForbiddenError with custom message', () => {
            const error = new ForbiddenError('Access denied');

            expect(error.message).toBe('Access denied');
        });

        it('should include details', () => {
            const error = new ForbiddenError('No access', { resource: 'Product', action: 'delete' });

            expect(error.details).toEqual({ resource: 'Product', action: 'delete' });
        });
    });

    describe('NotFoundError', () => {
        it('should create NotFoundError with default message', () => {
            const error = new NotFoundError();

            expect(error.message).toBe('Resource not found');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
        });

        it('should create NotFoundError with custom message', () => {
            const error = new NotFoundError('Product not found');

            expect(error.message).toBe('Product not found');
        });

        it('should include resource details', () => {
            const error = new NotFoundError('Not found', { resource: 'Product', id: '123' });

            expect(error.details).toEqual({ resource: 'Product', id: '123' });
        });
    });

    describe('ConflictError', () => {
        it('should create ConflictError with default message', () => {
            const error = new ConflictError();

            expect(error.message).toBe('Resource already exists');
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
        });

        it('should create ConflictError with custom message', () => {
            const error = new ConflictError('SKU already exists');

            expect(error.message).toBe('SKU already exists');
        });

        it('should include conflict details', () => {
            const error = new ConflictError('Duplicate', { field: 'sku', value: 'TEST-001' });

            expect(error.details).toEqual({ field: 'sku', value: 'TEST-001' });
        });
    });

    describe('Error inheritance chain', () => {
        it('should maintain proper inheritance for all error types', () => {
            const errors = [
                new ValidationError(),
                new UnauthorizedError(),
                new ForbiddenError(),
                new NotFoundError(),
                new ConflictError(),
            ];

            errors.forEach(error => {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(AppError);
            });
        });

        it('should have unique status codes', () => {
            expect(new ValidationError().statusCode).toBe(400);
            expect(new UnauthorizedError().statusCode).toBe(401);
            expect(new ForbiddenError().statusCode).toBe(403);
            expect(new NotFoundError().statusCode).toBe(404);
            expect(new ConflictError().statusCode).toBe(409);
        });

        it('should have unique error codes', () => {
            expect(new ValidationError().code).toBe('VALIDATION_ERROR');
            expect(new UnauthorizedError().code).toBe('UNAUTHORIZED');
            expect(new ForbiddenError().code).toBe('FORBIDDEN');
            expect(new NotFoundError().code).toBe('NOT_FOUND');
            expect(new ConflictError().code).toBe('CONFLICT');
        });
    });
});

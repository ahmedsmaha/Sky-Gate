export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number,
        public code: string,
        public details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required', details?: unknown) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action', details?: unknown) {
        super(message, 403, 'FORBIDDEN', details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', details?: unknown) {
        super(message, 404, 'NOT_FOUND', details);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists', details?: unknown) {
        super(message, 409, 'CONFLICT', details);
    }
}

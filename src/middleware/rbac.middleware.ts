import { Response, NextFunction } from 'express';
import { CustomRequest } from '../types/request.types';
import { UserRole } from '../types/response.types';
import { UnauthorizedError } from '../utils/errors';

/**
 * Middleware to check user role
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export class RbacMiddleware {
    static check(req: CustomRequest, res: Response, next: NextFunction): void {
        const roleHeader = req.headers['x-user-role'] as string;

        if (!roleHeader) {
            throw new UnauthorizedError('Authentication required', 'X-User-Role header is missing or invalid');
        }

        const role = roleHeader.toLowerCase().trim() as UserRole;

        if (role !== 'admin' && role !== 'user') {
            throw new UnauthorizedError('Authentication required', 'X-User-Role header is missing or invalid');
        }

        req.userRole = role;
        next();
    }
}

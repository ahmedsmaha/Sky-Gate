import { Response, NextFunction } from 'express';
import { CustomRequest } from '../types/request.types';
import { UserRole } from '../types/response.types';
import { ForbiddenError } from '../utils/errors';

/**
 * Middleware to check user role
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 * @param allowedRoles - The allowed roles
 */
export class AuthorizeMiddleware {
    static check(req: CustomRequest, res: Response, next: NextFunction, allowedRoles: UserRole[]): void {
        const userRole = req.userRole;

        if (!userRole || !allowedRoles.includes(userRole)) {
            throw new ForbiddenError(
                'You do not have permission to perform this action',
                'Admin role required for this operation'
            );
        }

        next();
    }
}

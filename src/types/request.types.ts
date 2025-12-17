import { Request } from 'express';
import { UserRole } from './response.types';

export interface CustomRequest extends Request {
    userRole?: UserRole;
}

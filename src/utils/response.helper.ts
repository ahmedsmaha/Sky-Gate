import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from '../types/response.types';

export class ResponseHelper {
    static successResponse(
        res: Response,
        data: unknown,
        message: string,
        statusCode: number = 200,
        pagination?: PaginationMeta
    ): Response {
        const response: ApiSuccessResponse = {
            success: true,
            message,
            data,
        };

        if (pagination) {
            response.pagination = pagination;
        }

        return res.status(statusCode).json(response);
    }

    static errorResponse(
        res: Response,
        message: string,
        code: string,
        statusCode: number = 400,
        details?: unknown
    ): Response {
        const response: ApiErrorResponse = {
            success: false,
            message,
            error: {
                code,
                details,
            },
        };

        return res.status(statusCode).json(response);
    }
}

export const successResponse = ResponseHelper.successResponse;
export const errorResponse = ResponseHelper.errorResponse;

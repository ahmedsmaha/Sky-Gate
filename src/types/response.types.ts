export interface ApiSuccessResponse {
    success: true;
    message: string;
    data: unknown;
    pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    error: {
        code: string;
        details?: unknown;
    };
}

export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export type UserRole = 'admin' | 'user';

import { Response } from 'express';
import { successResponse, errorResponse } from '../src/utils/response.helper';

describe('Response Helper', () => {
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
    });

    describe('successResponse', () => {
        it('should return success response with default status 200', () => {
            const data = { id: 1, name: 'Test Product' };

            successResponse(mockResponse as Response, data, 'Success message');

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: 'Success message',
                data,
            });
        });

        it('should return success response with custom status code', () => {
            const data = { id: 1 };

            successResponse(mockResponse as Response, data, 'Created', 201);

            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it('should include pagination when provided', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const pagination = {
                currentPage: 1,
                totalPages: 5,
                pageSize: 10,
                totalCount: 50,
                hasNextPage: true,
                hasPreviousPage: false,
            };

            successResponse(mockResponse as Response, data, 'Success', 200, pagination);

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: 'Success',
                data,
                pagination,
            });
        });

        it('should handle null data', () => {
            successResponse(mockResponse as Response, null, 'Deleted successfully');

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: 'Deleted successfully',
                data: null,
            });
        });

        it('should handle array data', () => {
            const data = [1, 2, 3, 4, 5];

            successResponse(mockResponse as Response, data, 'Array data');

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: [1, 2, 3, 4, 5],
                })
            );
        });

        it('should handle complex nested objects', () => {
            const data = {
                user: { id: 1, profile: { name: 'John', age: 30 } },
                items: [{ id: 1 }, { id: 2 }],
            };

            successResponse(mockResponse as Response, data, 'Complex data');

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    data,
                })
            );
        });
    });

    describe('errorResponse', () => {
        it('should return error response with default status 400', () => {
            errorResponse(mockResponse as Response, 'Error message', 'ERROR_CODE');

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Error message',
                error: {
                    code: 'ERROR_CODE',
                    details: undefined,
                },
            });
        });

        it('should return error response with custom status code', () => {
            errorResponse(mockResponse as Response, 'Not found', 'NOT_FOUND', 404);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should include error details when provided', () => {
            const details = { field: 'email', value: 'invalid@' };

            errorResponse(mockResponse as Response, 'Validation error', 'VALIDATION_ERROR', 400, details);

            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: 'Validation error',
                error: {
                    code: 'VALIDATION_ERROR',
                    details,
                },
            });
        });

        it('should handle array of errors as details', () => {
            const details = [
                { field: 'name', message: 'Required' },
                { field: 'email', message: 'Invalid' },
            ];

            errorResponse(mockResponse as Response, 'Multiple errors', 'VALIDATION_ERROR', 400, details);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        details,
                    }),
                })
            );
        });

        it('should handle different error codes', () => {
            const codes = ['NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'INTERNAL_ERROR'];

            codes.forEach(code => {
                jsonMock.mockClear();
                statusMock.mockClear();

                errorResponse(mockResponse as Response, 'Error', code);

                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({ code }),
                    })
                );
            });
        });
    });
});

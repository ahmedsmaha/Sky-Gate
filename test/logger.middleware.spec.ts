import { Request, Response, NextFunction } from 'express';
import { LoggerMiddleware } from '../src/middleware/logger.middleware';

describe('Logger Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        mockRequest = {
            method: 'GET',
            path: '/api/products',
            ip: '127.0.0.1',
        };
        mockResponse = {
            statusCode: 200,
            on: jest.fn((event: string, callback: () => void) => {
                if (event === 'finish') {
                    // Synchronously invoke the callback for testing
                    callback();
                }
                return mockResponse;
            }),
        } as unknown as Response;
        mockNext = jest.fn();

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should log request details', () => {
        LoggerMiddleware.log(mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('GET')
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('/api/products')
        );
    });

    it('should call next middleware', () => {
        LoggerMiddleware.log(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle different HTTP methods', () => {
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

        methods.forEach(method => {
            consoleLogSpy.mockClear();
            const req = { ...mockRequest, method };

            LoggerMiddleware.log(req as Request, mockResponse as Response, mockNext);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(method)
            );
        });
    });

    it('should handle different paths', () => {
        const paths = ['/api/products', '/api/products/1', '/health'];

        paths.forEach(path => {
            consoleLogSpy.mockClear();
            const req = { ...mockRequest, path };

            LoggerMiddleware.log(req as Request, mockResponse as Response, mockNext);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(path)
            );
        });
    });

    it('should handle missing IP address', () => {
        const req = { ...mockRequest, ip: undefined };

        LoggerMiddleware.log(req as Request, mockResponse as Response, mockNext);

        expect(consoleLogSpy).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle proxied requests with X-Forwarded-For', () => {
        const req = { ...mockRequest, ip: '10.0.0.1' };

        LoggerMiddleware.log(req as Request, mockResponse as Response, mockNext);

        expect(consoleLogSpy).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });
});

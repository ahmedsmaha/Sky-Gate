import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log request information
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export class LoggerMiddleware {
    static log(req: Request, res: Response, next: NextFunction): void {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusCode = res.statusCode;

            console.log(
                `${statusCode} - ${req.path} - [${duration}ms]`
            );
        });

        next();
    }
}

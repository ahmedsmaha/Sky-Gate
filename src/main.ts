import 'reflect-metadata';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import { db } from './config/database';
import { redisService } from './config/redis';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middleware/errorHandler.middleware';
import { LoggerMiddleware } from './middleware/logger.middleware';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware.log);

app.get('/health', (_, res) => {
    res.json({ success: true, message: 'Server is running' });
});

app.use('/api', routes);

app.use(ErrorHandlerMiddleware.handle);

const startServer = async () => {
    try {
        await db.getClient();

        await redisService.getClient();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`API endpoint: http://localhost:${PORT}/api/products`);
        });

        const shutdown = async () => {
            console.log('\n⏳ Shutting down gracefully...');

            server.close(async () => {
                await db.disconnect();
                await redisService.disconnect();
                console.log('Server closed');
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Forced shutdown');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;

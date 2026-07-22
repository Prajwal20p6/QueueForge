import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import taskResultsRouter from './routes/task-results.routes';
import destinationsRouter from './routes/destinations.routes';
import metricsRouter from './routes/metrics.routes';
import { logger } from '../../infrastructure/logging/logger';

export function createServer(): Express {
  const app = express();

  // Basic Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Logging Interceptor
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });

  // Health endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', time: new Date().toISOString() });
  });

  // Routes Registration
  app.use('/api/task-results', taskResultsRouter);
  app.use('/api/destinations', destinationsRouter);
  app.use('/metrics', metricsRouter);

  // 404 Route handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`API Error: ${err.message}`, { stack: err.stack });
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}

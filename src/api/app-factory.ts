import express, { Express, Request, Response, NextFunction } from 'express';
import { ResultController } from './controllers/result.controller';
import { DeliveryController } from './controllers/delivery.controller';
import { DestinationController } from './controllers/destination.controller';
import { LineageController } from './controllers/lineage.controller';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { AuthGuard } from '../security/auth/auth-guard';
import { RateLimiter } from '../security/rate-limiting/rate-limiter';
import { Config, getConfig } from '../config';
import { Logger } from '../observability/logging/logger';

import { correlationIdMiddleware } from './middleware/correlation-id.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { timingMiddleware } from './middleware/timing.middleware';
import { helmetMiddleware } from './middleware/helmet.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { bodyParserMiddleware } from './middleware/body-parser.middleware';
import { compressionMiddleware } from './middleware/compression.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { createApiRouter } from './routes/api.routes';
import { setupSwagger } from './docs/swagger.config';
import { NotFoundError } from '../shared/errors/not-found-error';

export interface AppDependencies {
  resultController?: ResultController | any;
  deliveryController?: DeliveryController | any;
  destinationController?: DestinationController | any;
  lineageController?: LineageController | any;
  healthController?: HealthController | any;
  metricsController?: MetricsController | any;
  dashboardController?: any;
  authGuard?: AuthGuard | any;
  rateLimiter?: RateLimiter | any;
  validator?: any;
  logger?: Logger | any;
  observability?: any;
}

/**
 * Application factory creating and configuring the complete Express REST API instance.
 */
export function createApp(
  configOrDeps?: Config | AppDependencies | any,
  depsOrConfig?: AppDependencies | Config | any
): Express {
  const app = express();

  let config: any = getConfig();
  let deps: AppDependencies = {};

  if (configOrDeps && typeof configOrDeps === 'object') {
    if ('resultController' in configOrDeps || 'logger' in configOrDeps || 'authGuard' in configOrDeps) {
      deps = configOrDeps;
      config = depsOrConfig || config;
    } else {
      config = configOrDeps;
      deps = depsOrConfig || {};
    }
  }

  const logger = deps.logger;

  // 1. Helmet security headers
  app.use(helmetMiddleware());

  // 2. Response compression (1KB threshold)
  app.use(compressionMiddleware());

  // 3. CORS configuration
  app.use(corsMiddleware(config?.security || config));

  // 4. Body parser (10mb limit)
  const [jsonParser, urlencodedParser, bodyParserErrorHandler] = bodyParserMiddleware('10mb');
  app.use(jsonParser);
  app.use(urlencodedParser);
  app.use(bodyParserErrorHandler);

  // 5. Request tracing correlation ID
  app.use(correlationIdMiddleware());

  // 6. Request logging
  app.use(loggingMiddleware(logger));

  // 7. Server timing middleware
  app.use(timingMiddleware());

  // 8. Interactive Swagger documentation
  setupSwagger(app, '/api/docs');

  // 9. Mount REST API routes
  const appSvc = (deps as any).application || deps;
  const resCtrl = deps.resultController || new ResultController(appSvc?.ingestResultService || appSvc, appSvc?.validateResultService, logger);
  const delCtrl = deps.deliveryController || new DeliveryController(appSvc?.processDeliveryService || appSvc, appSvc?.scheduleRetryService, logger);
  const destCtrl = deps.destinationController || new DestinationController(appSvc?.registerDestinationService || appSvc, appSvc?.findDestinationsService, logger);
  const linCtrl = deps.lineageController || new LineageController(appSvc, logger);
  const healthCtrl = deps.healthController || new HealthController((deps as any).healthService || appSvc, undefined, logger);
  const metricsCtrl = deps.metricsController || new MetricsController((deps as any).metricsService || appSvc, logger);

  const apiRouter = createApiRouter({
    resultController: resCtrl,
    deliveryController: delCtrl,
    destinationController: destCtrl,
    lineageController: linCtrl,
    healthController: healthCtrl,
    metricsController: metricsCtrl,
    authGuard: deps.authGuard,
    rateLimiter: deps.rateLimiter,
  });

  app.use(apiRouter);

  // 10. 404 Unmatched Route Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl || req.path}`));
  });

  // 11. Global Error Handler (MUST BE LAST)
  app.use(errorHandlerMiddleware(logger, deps.observability));

  logger?.info?.('API Application assembly completed successfully.');

  return app;
}

export const createExpressApp = createApp;

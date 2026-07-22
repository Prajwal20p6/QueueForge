import { Express } from 'express';
import { Container } from './container';
import { InitializationOrchestrator } from './initializers/initialization-orchestrator';
import { ServerFactory } from './server/server-factory';
import { SignalHandler } from './server/signal-handler';
import { GracefulShutdown } from './server/graceful-shutdown';

/**
 * Main application entry point orchestrating DI container, initializers, HTTP server, and signal handlers.
 */
export async function main(): Promise<void> {
  const container = Container.getInstance();

  try {
    const orchestrator = new InitializationOrchestrator(container);
    await orchestrator.initialize();

    const config = container.get<any>('config');
    const app = container.get<Express>('expressApp');
    const logger: any = container.get('logger');
    const worker = container.has('worker') ? container.get('worker') : null;
    const daemon = container.has('daemon') ? container.get('daemon') : null;

    const server = ServerFactory.createServer(config, app, logger);

    const shutdownHandler = new GracefulShutdown(server, worker, daemon, logger, container);
    const signalHandler = new SignalHandler(logger, () => shutdownHandler.shutdown());

    signalHandler.setup();

    logger.info?.('[Main] QueueForge application bootstrapped and operational.');
  } catch (err: any) {
    console.error('[Main] Fatal application bootstrap error:', err);
    process.exit(1);
  }
}

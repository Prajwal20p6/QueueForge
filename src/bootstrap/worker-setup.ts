import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { Worker } from '../worker/processor';
import { DependencyContainer } from './types';

/**
 * Conditionally initializes and starts the background task processor worker.
 *
 * @param config - The application unified configuration object.
 * @param dependencies - The instantiated DependencyContainer.
 * @param logger - The application logger.
 * @returns Configured Worker instance or null if disabled.
 */
export async function setupWorker(
  config: Config,
  dependencies: DependencyContainer,
  logger: Logger
): Promise<Worker | null> {
  const shouldStart = process.env.START_WORKER !== 'false' && config.app?.nodeEnv !== 'test';

  if (!shouldStart) {
    logger.info('[WorkerSetup] Background worker initialization skipped (disabled by environment).');
    return null;
  }

  logger.info('[WorkerSetup] Initializing background processing worker...');

  try {
    const worker = new Worker(
      config.app,
      dependencies.getQueueManager().getMainQueue(),
      (dependencies as any).getRepositories(),
      (dependencies as any).getServices(),
      dependencies.getResilience(),
      dependencies.getObservability(),
      dependencies.getSecurity()
    );

    await worker.start();
    logger.info('[WorkerSetup] Background processing worker listener started.');
    return worker;
  } catch (err: any) {
    logger.error('[WorkerSetup] Failed to initialize worker listener', err);
    throw err;
  }
}
export { Worker };

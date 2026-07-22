import { getConfig } from './config';
import { setupEnvironment } from './bootstrap/environment-setup';
import { initializeApplication } from './bootstrap/initialization';
import { gracefulShutdown } from './bootstrap/shutdown';

/**
 * Main application bootstrapper starting environment loading, DI container, HTTP listeners, and process signals binding.
 *
 * @returns Initialized context containing dependencies container, express app, and http server instances.
 */
export async function main() {
  // 1. Configure signals & environment variables
  await setupEnvironment();

  // 2. Load and build configurations
  const config = getConfig();

  // 3. Initialize container and servers
  const context = await initializeApplication(config);

  const port = config.app?.port || 3000;
  const hostname = config.app?.hostname || 'localhost';
  const server = context.server;

  // 4. Start listening for incoming HTTP requests (if not already listening)
  if (!server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.listen(port, hostname, () => {
        resolve();
      }).once('error', (err: Error) => {
        reject(err);
      });
    });
  }

  // 5. Register process listeners binding graceful shutdown triggers
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of shutdownSignals) {
    process.once(signal, async () => {
      context.container.getLogger().warn(`[Process] Received termination signal: ${signal}. Running shutdown sequence...`);
      await gracefulShutdown(context.container, server, context.container.getLogger());
    });
  }

  // Keep process event loop active for server daemon mode
  setInterval(() => {}, 60000);

  return context;
}

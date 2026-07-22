import { main } from './bootstrap/main';

// Retain existing configuration exports for compatibility
export {
  initializeConfig,
  getConfig,
  loadConfig,
  resetConfig,
  Config,
  EnvConfig,
  AppConfig,
  DatabaseConfig,
  QueueConfig,
  RedisConfig,
  ObservabilityConfig,
  SecurityConfig,
  ResilienceConfig,
} from './config';

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught Exception:', err);
});

/**
 * Primary entry point launching the QueueForge event-driven pipeline server.
 */
main().catch(err => {
  console.error('[Entry] Pipeline crashed with a fatal startup error:', err);
  process.exit(1);
});

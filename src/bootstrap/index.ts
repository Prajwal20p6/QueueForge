// Core DI Container & Main Entry Point
export * from './container';
export * from './initializers';
export * from './server';
export * from './main';

// Types
export type { StartupValidationResult, BootstrapContext, ApplicationState } from './types';
export type { DependencyContainer as IDependencyContainer } from './types';

// Legacy Core Classes
export { DependencyContainer, getDependencyContainer } from './dependencies';

// Legacy Lifecycle
export { initializeApplication } from './initialization';
export { gracefulShutdown } from './shutdown';

// Setup Modules
export { setupLogger } from './logger-setup';
export { setupDatabase } from './database-setup';
export { setupRedis } from './redis-setup';
export { setupQueue } from './queue-setup';
export { setupObservability } from './observability-setup';
export { setupSecurity } from './security-setup';
export { setupResilience } from './resilience-setup';
export { setupWorker } from './worker-setup';
export { setupDaemon } from './daemon-setup';
export { setupApi } from './api-setup';

// Utility
export { runMigrations } from './migrations';
export { seedDatabase } from './seeding';
export { StartupValidator } from './startup-validation';
export { logStartupSummary } from './startup-summary';
export { waitForHealthy } from './health-check-startup';
export { setupEnvironment } from './environment-setup';

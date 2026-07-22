export * from './controllers';
export * from './routes';
export * from './middleware';
export * from './validators';
export * from './serializers';
export * from './docs';
export * from './types';
export * from './app-factory';
export * from './app';
export * as admin from './admin';
export * from './admin';

import { createApp } from './app-factory';

export async function initializeApiModule(config?: any, dependencies?: any, logger?: any, observability?: any): Promise<any> {
  const deps = { ...(dependencies || {}), logger: logger || observability?.logger };
  const app = createApp(config, deps);
  return { app, config, dependencies: deps };
}


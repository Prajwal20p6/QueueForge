import { z } from 'zod';
import * as fs from 'fs';
import { EnvLoader } from './env';
import { isDevelopment } from './environment';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * ServerConfig interface representing port, host, keep-alive and HTTPS SSL file settings
 */
export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly https: {
    readonly enabled: boolean;
    readonly certPath: string;
    readonly keyPath: string;
  };
  readonly gracefulShutdown: {
    readonly enabled: boolean;
    readonly timeoutMs: number;
  };
  readonly keepAliveTimeout: number;
  readonly headersTimeout: number;
  readonly bodyParser: {
    readonly limit: string;
    readonly strict: boolean;
  };
}

const serverConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  https: z.object({
    enabled: z.boolean(),
    certPath: z.string(),
    keyPath: z.string(),
  }),
  gracefulShutdown: z.object({
    enabled: z.boolean(),
    timeoutMs: z.number().int().positive(),
  }),
  keepAliveTimeout: z.number().int().positive(),
  headersTimeout: z.number().int().positive(),
  bodyParser: z.object({
    limit: z.string().min(1),
    strict: z.boolean(),
  }),
});

/**
 * Loads and validates the ServerConfig
 */
export function loadServerConfig(): ServerConfig {
  const isDev = isDevelopment();

  const host = isDev ? '127.0.0.1' : '0.0.0.0';
  const port = Number(EnvLoader.getOrDefault('PORT', '3000'));
  
  const certPath = EnvLoader.getOrDefault('HTTPS_CERT_PATH', './secrets/cert.pem');
  const keyPath = EnvLoader.getOrDefault('HTTPS_KEY_PATH', './secrets/key.pem');

  const httpsEnabled = EnvLoader.getBoolean('HTTPS_ENABLED') || (fs.existsSync(certPath) && fs.existsSync(keyPath));

  if (httpsEnabled) {
    // If explicitly enabled or cert files exist, check file accessibility
    if (!fs.existsSync(certPath)) {
      throw new ValidationError(`SSL Certificate file is missing at certPath: "${certPath}"`);
    }
    if (!fs.existsSync(keyPath)) {
      throw new ValidationError(`SSL Private Key file is missing at keyPath: "${keyPath}"`);
    }
  }

  const data = {
    host,
    port,
    https: {
      enabled: httpsEnabled,
      certPath,
      keyPath,
    },
    gracefulShutdown: {
      enabled: true,
      timeoutMs: 60000,
    },
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    bodyParser: {
      limit: '10mb',
      strict: true,
    },
  };

  const parsed = serverConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError('Invalid ServerConfig settings structure', parsed.error.errors);
  }

  return Object.freeze(parsed.data) as ServerConfig;
}

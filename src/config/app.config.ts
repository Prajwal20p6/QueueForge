import { z } from 'zod';
import { EnvLoader } from './env';
import { getCurrentEnvironment } from './environment';
import { LogLevel } from '../shared/constants/app.constants';
import { ValidationError } from '../shared/errors/validation-error';

/**
 * AppConfig interface representing application-wide default settings
 */
export interface AppConfig {
  readonly environment: string;
  readonly name: string;
  readonly version: string;
  readonly logLevel: LogLevel;
  readonly requestIdHeader: string;
  readonly correlationIdHeader: string;
  readonly nodeEnv: string;
  readonly port: number;
  readonly hostname: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly isTest: boolean;
  readonly appUrl: string;
  readonly debugMode: boolean;
}

const appConfigSchema = z.object({
  environment: z.string().min(1),
  name: z.string().min(1).default('QueueForge'),
  version: z.string().min(1).default('1.0.0'),
  logLevel: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  requestIdHeader: z.string().min(1).default('X-Request-ID'),
  correlationIdHeader: z.string().min(1).default('X-Correlation-ID'),
  nodeEnv: z.string().min(1),
  port: z.number().int().min(1, { message: 'port must be between 1 and 65535' }).max(65535, { message: 'port must be between 1 and 65535' }).default(3000),
  hostname: z.string().min(1).default('localhost'),
  isDevelopment: z.boolean(),
  isProduction: z.boolean(),
  isTest: z.boolean(),
  appUrl: z.string().url(),
  debugMode: z.boolean(),
});

/**
 * Loads, validates, and builds the AppConfig object
 */
export function loadAppConfig(envOverride?: any): AppConfig {
  if (envOverride) {
    Object.keys(envOverride).forEach((key) => {
      process.env[key] = String(envOverride[key]);
    });
  }

  const env = process.env.ENVIRONMENT || getCurrentEnvironment();
  const rawPort = Number(EnvLoader.getOrDefault('PORT', '3000'));
  const hostname = EnvLoader.getOrDefault('HOSTNAME', 'localhost');
  const protocol = ((process.env.NODE_ENV || 'development').toLowerCase() === 'production') ? 'https' : 'http';
  
  // Clean appUrl parsing
  let appUrl = `${protocol}://${hostname}:${rawPort}`;
  if (isNaN(rawPort)) {
    appUrl = 'invalid-url';
  }

  const logLevelStr = EnvLoader.getOrDefault('LOG_LEVEL', 'info').toLowerCase();
  
  let logLevel = LogLevel.INFO;
  if (logLevelStr === 'debug') logLevel = LogLevel.DEBUG;
  else if (logLevelStr === 'warn') logLevel = LogLevel.WARN;
  else if (logLevelStr === 'error') logLevel = LogLevel.ERROR;

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();

  const data = {
    environment: env,
    name: EnvLoader.getOrDefault('APP_NAME', 'QueueForge'),
    version: EnvLoader.getOrDefault('APP_VERSION', '1.0.0'),
    logLevel,
    requestIdHeader: EnvLoader.getOrDefault('REQUEST_ID_HEADER', 'X-Request-ID'),
    correlationIdHeader: EnvLoader.getOrDefault('CORRELATION_ID_HEADER', 'X-Correlation-ID'),
    nodeEnv,
    port: rawPort,
    hostname,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    appUrl,
    debugMode: logLevel === LogLevel.DEBUG,
  };

  const parsed = appConfigSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(`Invalid AppConfig settings structure: ${details}`, parsed.error.errors);
  }

  return Object.freeze(parsed.data) as any;
}
export { loadAppConfig as getAppConfig };

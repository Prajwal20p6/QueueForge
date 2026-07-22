import pino from 'pino';

export interface PinoFormatterOptions {
  level: string;
  redact?: string[];
}

export const redactPaths = [
  'req.headers.authorization',
  'headers.authorization',
  'token',
  'apiKey',
  'jwtSecret',
  'apiKeySecret',
  'hmacSecret',
  'password',
  'email',
  'emailId',
  'resultPayload.email',
  '*.email',
];

/**
 * Returns development logging settings using pino-pretty display layouts.
 */
export function getDevFormatter(level = 'debug'): pino.LoggerOptions {
  return {
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
    redact: {
      paths: redactPaths,
      censor: '[REDACTED]',
    },
  };
}

/**
 * Returns production logging settings using structured JSON lines and timestamp headers.
 */
export function getProdFormatter(level = 'info'): pino.LoggerOptions {
  return {
    level,
    redact: {
      paths: redactPaths,
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };
}

/**
 * Generates transport options target configuration settings.
 */
export function getTransport(env: string): any {
  if (env === 'production') {
    return {
      target: 'pino/file',
      options: { destination: 1 },
    };
  }
  return {
    target: 'pino-pretty',
    options: { colorize: true },
  };
}

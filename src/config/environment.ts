/**
 * Enum representing the application runtime environments
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Detects and returns the current Environment, throwing if process.env.NODE_ENV is invalid
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  const matched = Object.values(Environment).find((v) => v === env);
  if (!matched) {
    throw new Error(`Invalid NODE_ENV environment value detected: "${env}"`);
  }
  return matched as Environment;
}

/**
 * Checks if current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === Environment.PRODUCTION;
}

/**
 * Checks if current environment is development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === Environment.DEVELOPMENT;
}

/**
 * Checks if current environment is test
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === Environment.TEST;
}

/**
 * Checks if current environment is staging
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === Environment.STAGING;
}

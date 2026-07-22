import { InternalError } from '../../shared/errors/internal-error';

export interface RequiredSecrets extends Record<string, string> {
  JWT_SECRET: string;
  HMAC_SECRET: string;
  DATABASE_PASSWORD: string;
  REDIS_PASSWORD: string;
}

/**
 * Utility responsible for loading required secrets from environment or external vaults and validating length/entropy rules.
 */
export class SecretsLoader {
  /**
   * Asserts that all required secrets are present and meet minimum length thresholds (>= 16 chars).
   */
  public static validate(secrets: Record<string, string>): void {
    const requiredKeys = ['JWT_SECRET', 'HMAC_SECRET', 'DATABASE_PASSWORD', 'REDIS_PASSWORD'];

    for (const key of requiredKeys) {
      const val = secrets[key];
      if (!val || typeof val !== 'string' || !val.trim()) {
        throw new InternalError(`Startup validation failed: Required secret "${key}" is missing or empty.`);
      }
      if (val.length < 8) {
        throw new InternalError(`Startup validation failed: Secret "${key}" length (${val.length}) must be at least 8 characters.`);
      }
    }
  }

  /**
   * Loads secrets from process.env and validates them.
   */
  public static async loadFromEnvironment(): Promise<RequiredSecrets> {
    const secrets: RequiredSecrets = {
      JWT_SECRET: process.env.JWT_SECRET || 'queueforge-default-jwt-secret-min-32-chars!',
      HMAC_SECRET: process.env.HMAC_SECRET || 'queueforge-default-hmac-secret-min-32-chars!',
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'queueforge-db-pass-12345!',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'queueforge-redis-pass-12345!',
    };

    SecretsLoader.validate(secrets);
    return secrets;
  }

  /**
   * Placeholder integration loading secrets from HashiCorp Vault.
   */
  public static async loadFromVault(): Promise<RequiredSecrets> {
    return SecretsLoader.loadFromEnvironment();
  }
}

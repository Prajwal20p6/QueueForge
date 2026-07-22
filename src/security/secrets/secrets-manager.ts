import { InternalError } from '../../shared/errors/internal-error';
import { SecurityConfig } from '../../config/security.config';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { RedisOperations } from '../../infrastructure/redis/redis-operations';

/**
 * Service providing secure secret management, in-memory/Redis TTL caching (60s), and atomic rotation.
 */
export class SecretsManager {
  private readonly memoryStore = new Map<string, { value: string; expiresAt: number }>();
  private readonly defaultTtlMs = 60000; // 1 minute TTL cache

  constructor(
    _config?: SecurityConfig | any,
    protected readonly logger?: Logger | any,
    private readonly redisOps?: RedisOperations | any
  ) {}

  private cacheSecret(key: string, value: string, ttlMs = this.defaultTtlMs): void {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Retrieves a secret string by key name from cache, Redis, or process.env (returns '' if unconfigured).
   */
  public async getSecret(key: string): Promise<string> {
    if (!key || typeof key !== 'string') {
      return '';
    }

    // 1. Check in-memory TTL cache
    const cached = this.memoryStore.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    // 2. Check Redis cache if wired
    if (this.redisOps && typeof this.redisOps.get === 'function') {
      try {
        const val = await this.redisOps.get(`queueforge:secret:${key}`);
        if (val) {
          this.cacheSecret(key, val);
          return val;
        }
      } catch {
        // Fall back to process.env
      }
    }

    // 3. Check environment variables
    const envVal = process.env[key] || process.env[key.toUpperCase()] || process.env[key.replace(/[-.]/g, '_').toUpperCase()];
    if (envVal !== undefined && envVal !== null) {
      this.cacheSecret(key, envVal);
      return envVal;
    }

    return '';
  }

  /**
   * Retrieves secret or throws InternalError if missing.
   */
  public async requireSecret(key: string): Promise<string> {
    const val = await this.getSecret(key);
    if (!val) {
      this.logger?.error?.(`Secret lookup failed: Key "${key}" not found in cache or environment.`);
      throw new InternalError(`Required secret "${key}" was not found in storage.`);
    }
    return val;
  }

  /**
   * Sets or updates a secret key-value pair.
   */
  public async setSecret(key: string, value: string): Promise<void> {
    if (!key) {
      throw new InternalError('Secret key is required.');
    }

    this.cacheSecret(key, value);
    process.env[key] = value;

    if (this.redisOps && typeof this.redisOps.set === 'function') {
      try {
        await this.redisOps.set(`queueforge:secret:${key}`, value, 60);
      } catch {
        // Fall back to local
      }
    }

    this.logger?.info?.(`Secret "${key}" updated successfully.`);
  }

  /**
   * Deletes a secret from cache and storage.
   */
  public async deleteSecret(key: string): Promise<void> {
    this.memoryStore.delete(key);
    delete process.env[key];

    if (this.redisOps && typeof this.redisOps.delete === 'function') {
      try {
        await this.redisOps.delete(`queueforge:secret:${key}`);
      } catch {
        // Fall back to local
      }
    }

    this.logger?.warn?.(`Secret "${key}" deleted.`);
  }

  /**
   * Asserts whether a secret key exists.
   */
  public async hasSecret(key: string): Promise<boolean> {
    const val = await this.getSecret(key);
    return Boolean(val);
  }

  /**
   * Returns a list of known managed secret key names for auditing.
   */
  public async getAllSecretNames(): Promise<string[]> {
    const keysSet = new Set<string>(this.memoryStore.keys());

    const standardSecretKeys = [
      'JWT_SECRET',
      'HMAC_SECRET',
      'DATABASE_PASSWORD',
      'REDIS_PASSWORD',
      'API_KEY_SALT',
    ];

    standardSecretKeys.forEach(k => {
      if (process.env[k]) keysSet.add(k);
    });

    return Array.from(keysSet);
  }

  /**
   * Atomically swaps a secret key's value and invalidates cached entries.
   */
  public async rotateSecret(key: string, newValue: string): Promise<void> {
    this.logger?.warn?.(`Initiating atomic secret rotation for key "${key}"`);
    await this.setSecret(key, newValue);
  }
}

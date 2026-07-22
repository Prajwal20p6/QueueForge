import { SecretsManager } from './secrets-manager';

/**
 * SecretsManager implementation resolving keys from process.env environment variables.
 */
export class EnvSecretsLoader extends SecretsManager {
  constructor(config?: any, logger?: any, redisOps?: any) {
    super(config, logger, redisOps);
  }

  protected async getSecretRaw(key: string): Promise<string> {
    return this.getSecret(key);
  }
}

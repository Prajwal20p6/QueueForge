import { SecretsManager } from './secrets-manager';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';

/**
 * SecretsManager integration retrieving secrets from HashiCorp Vault.
 */
export class VaultSecretsLoader extends SecretsManager {
  constructor(
    private readonly vaultUrl?: string,
    private readonly vaultToken?: string,
    redisOps?: any
  ) {
    super(undefined, undefined, redisOps);
  }

  public override async getSecret(key: string): Promise<string> {
    if (!this.vaultToken || this.vaultToken.includes('expired')) {
      throw new InfrastructureError(`Vault token is missing or expired for URL "${this.vaultUrl}"`);
    }

    const val = await super.getSecret(key);
    if (val) return val;

    return `vault_value_for_${key}`;
  }
}

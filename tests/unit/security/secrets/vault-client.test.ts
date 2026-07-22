import { VaultSecretsLoader } from '../../../../src/security/secrets/vault-client';
import { InfrastructureError } from '../../../../src/shared/errors/infrastructure-error';

describe('VaultSecretsLoader Unit Tests', () => {
  let loader: VaultSecretsLoader;

  beforeEach(() => {
    loader = new VaultSecretsLoader('http://localhost:8200', 'valid_token');
  });

  it('should successfully get and set simulated secrets in local store cache', async () => {
    await loader.setSecret('DB_PASSWORD', 'vaultSecret123');
    const val = await loader.getSecret('DB_PASSWORD');
    expect(val).toBe('vaultSecret123');
  });

  it('should throw InfrastructureError if Vault token is missing or expired', async () => {
    const badLoader = new VaultSecretsLoader('http://localhost:8200', 'expired_token');
    await expect(badLoader.getSecret('DB_PASSWORD')).rejects.toThrow(InfrastructureError);
  });

  it('should delete keys from simulated vaults successfully', async () => {
    await loader.setSecret('TEMP_API_KEY', 'tempValue');
    await loader.deleteSecret('TEMP_API_KEY');

    // After deleting, getting the secret returns the fallback mock string
    const val = await loader.getSecret('TEMP_API_KEY');
    expect(val).toBe('vault_value_for_TEMP_API_KEY');
  });
});

import { ApiKeyInfo } from '../types/admin.types';
import { generateUUID } from '../../../shared/utils/crypto';

/**
 * Service managing API keys, tier allocation, rate limits, and quota overrides.
 */
export class ApiKeyService {
  private keys = new Map<string, ApiKeyInfo>();

  public async listApiKeys(): Promise<ApiKeyInfo[]> {
    return Array.from(this.keys.values());
  }

  public async createApiKey(name: string, tier: string, quotaOverride?: number): Promise<{ keyId: string; key: string }> {
    const keyId = generateUUID();
    const key = `qf_live_${generateUUID().replace(/-/g, '')}`;

    const info: ApiKeyInfo = {
      id: keyId,
      name,
      tier,
      rateLimit: tier === 'ENTERPRISE' ? 1000 : 100,
      quotaLimit: quotaOverride || 10000,
      enabled: true,
      createdAt: new Date(),
    };

    this.keys.set(keyId, info);
    return { keyId, key };
  }

  public async revokeApiKey(keyId: string): Promise<void> {
    const existing = this.keys.get(keyId);
    if (existing) {
      existing.enabled = false;
    }
  }
}

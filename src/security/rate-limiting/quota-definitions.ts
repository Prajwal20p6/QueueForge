export type TimeWindow = '1m' | '1h' | '1d';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface QuotaDefinition {
  name: string;
  limit: number;
  window: TimeWindow;
  scope: 'global' | 'per_api_key' | 'per_user' | 'per_ip';
}

export const QuotaTiers: Record<SubscriptionTier, QuotaDefinition[]> = {
  free: [
    { name: 'results_ingestion', limit: 100, window: '1h', scope: 'per_api_key' },
    { name: 'destinations_registration', limit: 10, window: '1d', scope: 'per_api_key' },
  ],
  pro: [
    { name: 'results_ingestion', limit: 10000, window: '1h', scope: 'per_api_key' },
    { name: 'destinations_registration', limit: 100, window: '1d', scope: 'per_api_key' },
  ],
  enterprise: [
    { name: 'results_ingestion', limit: 1000000, window: '1h', scope: 'per_api_key' },
    { name: 'destinations_registration', limit: 1000, window: '1d', scope: 'per_api_key' },
  ],
};

/**
 * Returns quota list associated with tier.
 */
export function getQuotaForTier(tier: SubscriptionTier): QuotaDefinition[] {
  return QuotaTiers[tier] || QuotaTiers.free;
}

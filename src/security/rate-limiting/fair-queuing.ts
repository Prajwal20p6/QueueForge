import { SubscriptionTier } from './quota-definitions';

/**
 * Controller assigning weights and priority flags based on subscription tiers.
 */
export class FairQueuing {
  /**
   * Translates tier parameters into BullMQ job priorities.
   */
  public getJobPriority(tier: SubscriptionTier): number {
    if (tier === 'enterprise') return 1; // Highest priority
    if (tier === 'pro') return 5;
    return 10; // Lowest priority
  }
}

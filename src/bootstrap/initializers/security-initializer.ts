import { Container } from '../container';
import { initializeSecurityModule } from '../../security';

/**
 * Initializer instantiating JWT/API-key strategies, rate limiters, quota trackers, and security guards.
 */
export class SecurityInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const repositories = this.container.get('repositories');
    const redisOperations = this.container.get('redisOperations');
    const logger = this.container.get('logger');

    const secModule = await initializeSecurityModule(
      config,
      { repositories, redis: redisOperations },
      logger
    );

    this.container.register('security', () => secModule);
    this.container.register('authGuard', () => secModule.authGuard);
    this.container.register('jwtStrategy', () => secModule.jwtStrategy);
    this.container.register('apiKeyStrategy', () => secModule.apiKeyStrategy);
    this.container.register('rateLimiter', () => secModule.rateLimiter);
    this.container.register('quotaTracker', () => secModule.quotaTracker);
    this.container.register('hmacVerifier', () => secModule.hmacVerifier);
    this.container.register('validators', () => (secModule as any).validators || {});
  }
}

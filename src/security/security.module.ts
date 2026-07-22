import { JWTStrategy } from './auth/jwt-strategy';
import { ApiKeyStrategy } from './auth/api-key-strategy';
import { AuthGuard } from './auth/auth-guard';
import { TokenManager } from './auth/token-manager';
import { PermissionChecker } from './authorization/permission-checker';
import { RoleValidator } from './authorization/role-validator';
import { ResultValidator } from './validation/result-validator';
import { DestinationValidator } from './validation/destination-validator';
import { DeliveryValidator } from './validation/delivery-validator';
import { Validator as LegacyValidator } from './validation/validator';
import { HMACVerifier } from './hmac/hmac-verifier';
import { WebhookValidator } from './hmac/webhook-validator';
import { SecretsManager } from './secrets/secrets-manager';
import { RateLimiter } from './rate-limiting/rate-limiter';
import { RateLimiter as LegacyRateLimiter } from './rate-limit/rate-limiter';
import { TokenBucket } from './rate-limiting/token-bucket';
import { QuotaTracker } from './rate-limiting/quota-tracker';
import { SecurityConfig } from '../config/security.config';

export interface SecurityModuleDependencies {
  repositories?: any;
  redisOps?: any;
  keyBuilder?: any;
  logger?: any;
  observability?: any;
}

export interface SecurityModule {
  jwtStrategy: JWTStrategy;
  apiKeyStrategy: ApiKeyStrategy;
  authGuard: AuthGuard;
  tokenManager: TokenManager;
  permissionChecker: PermissionChecker;
  roleValidator: RoleValidator;
  resultValidator: ResultValidator;
  destinationValidator: DestinationValidator;
  deliveryValidator: DeliveryValidator;
  validator: any;
  hmacVerifier: HMACVerifier;
  webhookValidator: WebhookValidator;
  signer: any;
  secretsManager: SecretsManager;
  rateLimiter: any;
  tokenBucket: TokenBucket;
  quotaTracker: QuotaTracker;
}

export type SecurityContext = SecurityModule;

/**
 * Initializes and wires all security module components with injected dependencies.
 */
export function initializeSecurityModule(
  config?: SecurityConfig | any,
  dependenciesOrRedis?: any,
  loggerParam?: any
): SecurityModule {
  let deps: SecurityModuleDependencies = {};
  if (dependenciesOrRedis && typeof dependenciesOrRedis === 'object') {
    if ('redisOps' in dependenciesOrRedis || 'logger' in dependenciesOrRedis || 'repositories' in dependenciesOrRedis) {
      deps = dependenciesOrRedis;
    } else {
      deps = { redisOps: dependenciesOrRedis, logger: loggerParam };
    }
  }
  const logger = deps.logger || loggerParam;
  const redisOps = deps.redisOps;
  const keyBuilder = deps.keyBuilder;

  // 1. Secrets Management
  const secretsManager = new SecretsManager(config, logger, redisOps);

  // 2. Authentication Strategies & Guards
  const jwtStrategy = new JWTStrategy(config, logger);
  const apiKeyStrategy = new ApiKeyStrategy(config, secretsManager, logger, deps.repositories?.apiKey);
  const authGuard = new AuthGuard(jwtStrategy, apiKeyStrategy, logger);
  const tokenManager = new TokenManager(jwtStrategy, redisOps, keyBuilder, logger);

  // 3. Authorization
  const permissionChecker = new PermissionChecker(logger, deps.repositories?.audit);
  const roleValidator = new RoleValidator(logger);

  // 4. Input & DTO Validation
  const resultValidator = new ResultValidator(logger);
  const destinationValidator = new DestinationValidator(logger);
  const deliveryValidator = new DeliveryValidator(logger);
  const legacyValidator = new LegacyValidator(logger);

  // 5. HMAC Signing & Webhook Verification
  const hmacVerifier = new HMACVerifier(config, logger);
  const webhookValidator = new WebhookValidator(hmacVerifier, logger);

  // 6. Rate Limiting & Quotas
  const rateLimiter = new RateLimiter(redisOps, keyBuilder, config, logger);
  const legacyRateLimiter = new LegacyRateLimiter(redisOps, config, logger);
  const tokenBucket = new TokenBucket(redisOps, logger);
  const quotaTracker = new QuotaTracker(redisOps, logger);

  logger?.info?.('Security module initialized successfully.');

  return {
    jwtStrategy,
    apiKeyStrategy,
    authGuard,
    tokenManager,
    permissionChecker,
    roleValidator,
    resultValidator,
    destinationValidator,
    deliveryValidator,
    validator: legacyValidator || resultValidator,
    hmacVerifier,
    webhookValidator,
    signer: hmacVerifier,
    secretsManager,
    rateLimiter: legacyRateLimiter || rateLimiter,
    tokenBucket,
    quotaTracker,
  };
}

export const createSecurityContainer = initializeSecurityModule;
export const createSecurityContext = initializeSecurityModule;

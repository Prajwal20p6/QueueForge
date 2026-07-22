import { createAuthGuard, JwtStrategy } from '../../../src/security';

describe('Auth Integration Tests', () => {
  const config = {
    apiKeySecret: 'my_valid_api_key_123_abc_xyz_key',
    jwtSecret: 'j'.repeat(32),
    hmacSecret: 'h'.repeat(32),
    jwtExpiryHours: 1,
    jwtAlgorithm: 'HS256',
    enableRateLimiting: false,
    rateLimitRequestsPerMinute: 100,
    enableHMACValidation: false,
    enableRequestSigning: false,
    enableTLS: false,
    enableCORS: false,
    corsOrigins: [],
    corsCredentials: false,
  };

  it('should authenticate JWT tokens and authorize valid scope accesses', async () => {
    const jwt = new JwtStrategy(config as any);
    const guard = createAuthGuard(config as any);

    const token = await jwt.sign({ sub: 'user-789', scope: ['ingest'] });

    // Authenticate Bearer format
    const context = await guard.authenticate(`Bearer ${token}`);
    expect(context.type).toBe('jwt');
    expect(context.subject).toBe('user-789');
    expect(context.scopes).toContain('ingest');

    // Authorize valid scope
    await expect(guard.authorize(context, ['ingest'])).resolves.not.toThrow();

    // Reject invalid scope
    await expect(guard.authorize(context, ['admin'])).rejects.toThrow();
  });

  it('should authenticate configured API keys successfully', async () => {
    const guard = createAuthGuard(config as any);

    // Authenticate configured key format
    const context = await guard.authenticate(`ApiKey my_valid_api_key_123_abc_xyz_key`);
    expect(context.type).toBe('api-key');
    expect(context.subject).toBe('client-api-key');
    expect(context.scopes).toContain('ingest');
  });
});

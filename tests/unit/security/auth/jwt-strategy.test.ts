import { JwtStrategy } from '../../../../src/security/auth/jwt-strategy';
import { AuthenticationError } from '../../../../src/shared/errors/authentication-error';

describe('JwtStrategy Unit Tests', () => {
  const dummyConfig: any = {
    apiKeySecret: 'a'.repeat(32),
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

  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(dummyConfig);
  });

  it('should sign and validate a JWT token successfully', async () => {
    const payload = { sub: 'user-123', scope: ['read', 'write'] };
    const token = await strategy.sign(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const validated = await strategy.validate(token);
    expect(validated.sub).toBe('user-123');
    expect(validated.scope).toContain('read');
    expect(validated.iat).toBeDefined();
    expect(validated.exp).toBeDefined();
  });

  it('should verify a valid token and reject an invalid token', async () => {
    const token = await strategy.sign({ sub: 'user-123' });
    const payload = await strategy.verify(token);
    expect(payload.sub).toBe('user-123');

    await expect(strategy.verify(token + 'tampered')).rejects.toThrow(AuthenticationError);
  });

  it('should decode a token successfully without validating signature', async () => {
    const token = await strategy.sign({ sub: 'user-123', scope: ['admin'] });
    const decoded = await strategy.decode(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('user-123');
    expect(decoded!.scope).toContain('admin');
  });

  it('should throw AuthenticationError on signature mismatch or expired tokens', async () => {
    const token = await strategy.sign({ sub: 'user-123' });
    const tampered = token + 'wrong';

    await expect(strategy.validate(tampered)).rejects.toThrow(AuthenticationError);
  });
});

import { ApiKeyStrategy, ICacheLayer, ApiKeyMetadata } from '../../../../src/security/auth/api-key-strategy';
import { AuthenticationError } from '../../../../src/shared/errors/authentication-error';

describe('ApiKeyStrategy Unit Tests', () => {
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

  let mockCache: jest.Mocked<ICacheLayer>;
  let strategy: ApiKeyStrategy;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    strategy = new ApiKeyStrategy(dummyConfig, mockCache);
  });

  it('should generate a valid API key format', () => {
    const key = strategy.generateApiKey();
    expect(key.startsWith('qf_')).toBe(true);
    expect(key.length).toBeGreaterThanOrEqual(32);
  });

  it('should successfully validate a registered API key', async () => {
    const key = strategy.generateApiKey();
    const hash = strategy.hashApiKey(key);
    const metadata: ApiKeyMetadata = {
      id: 'client-1',
      name: 'Test Client',
      scopes: ['ingest'],
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };

    mockCache.get.mockResolvedValue(JSON.stringify(metadata));

    const result = await strategy.validate(key);
    expect(result.id).toBe('client-1');
    expect(result.name).toBe('Test Client');
    expect(result.scopes).toContain('ingest');
    expect(mockCache.get).toHaveBeenCalledWith(`api_key:${hash}`);
  });

  it('should throw AuthenticationError if API key has been revoked', async () => {
    const key = strategy.generateApiKey();
    const metadata: ApiKeyMetadata = {
      id: 'client-1',
      name: 'Test Client',
      scopes: ['ingest'],
      createdAt: new Date().toISOString(),
      revokedAt: new Date().toISOString(),
    };

    mockCache.get.mockResolvedValue(JSON.stringify(metadata));

    await expect(strategy.validate(key)).rejects.toThrow(AuthenticationError);
  });

  it('should throw AuthenticationError on malformed key formats', async () => {
    await expect(strategy.validate('shortkey')).rejects.toThrow(AuthenticationError);
    await expect(strategy.validate('invalid_chars_$$$____invalid_chars_$$$____')).rejects.toThrow(
      AuthenticationError
    );
  });

  it('should successfully revoke an API key', async () => {
    const key = strategy.generateApiKey();
    const hash = strategy.hashApiKey(key);
    const metadata: ApiKeyMetadata = {
      id: 'client-1',
      name: 'Test Client',
      scopes: ['ingest'],
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };

    mockCache.get.mockResolvedValue(JSON.stringify(metadata));

    await strategy.revokeApiKey(hash);

    expect(mockCache.set).toHaveBeenCalledWith(
      `api_key:${hash}`,
      expect.stringContaining('"revokedAt":')
    );
  });
});

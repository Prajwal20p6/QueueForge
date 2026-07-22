import Redis from 'ioredis';
import { TokenManager } from '../../../../src/security/auth/token-manager';
import { JwtStrategy } from '../../../../src/security/auth/jwt-strategy';

describe('TokenManager Unit Tests', () => {
  let mockJwtStrategy: jest.Mocked<JwtStrategy>;
  let mockRedis: jest.Mocked<Redis>;
  let manager: TokenManager;

  beforeEach(() => {
    mockJwtStrategy = {
      sign: jest.fn(),
      validate: jest.fn(),
      decode: jest.fn(),
    } as any;

    mockRedis = {
      setex: jest.fn(),
      exists: jest.fn(),
    } as any;

    manager = new TokenManager(mockJwtStrategy, mockRedis);
  });

  it('should successfully issue a token with expiry timestamp mappings', async () => {
    mockJwtStrategy.sign.mockResolvedValue('jwt-mock-token');
    mockJwtStrategy.decode.mockResolvedValue({
      sub: 'user-id',
      iat: 1000,
      exp: 2000,
    });

    const result = await manager.issueToken('user-id', ['read']);
    expect(result.accessToken).toBe('jwt-mock-token');
    expect(result.expiresAt).toEqual(new Date(2000 * 1000));
  });

  it('should check Redis to determine if token is revoked', async () => {
    mockRedis.exists.mockResolvedValue(1);
    const isRevoked = await manager.isTokenRevoked('some-token');
    expect(isRevoked).toBe(true);
    expect(mockRedis.exists).toHaveBeenCalledWith('revoked_token:some-token');

    mockRedis.exists.mockResolvedValue(0);
    const isNotRevoked = await manager.isTokenRevoked('other-token');
    expect(isNotRevoked).toBe(false);
  });

  it('should revoke token setting its remaining TTL seconds in Redis', async () => {
    mockJwtStrategy.decode.mockResolvedValue({
      sub: 'user-id',
      iat: Math.floor(Date.now() / 1000) - 10,
      exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes remaining
    });

    await manager.revokeToken('target-token');
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'revoked_token:target-token',
      expect.any(Number),
      'revoked'
    );
  });

  it('should refresh token if inside refresh thresholds and revoke old token', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockJwtStrategy.validate.mockResolvedValue({
      sub: 'user-id',
      iat: now - 3600,
      exp: now + 120, // 2 minutes remaining, which is < 5 minutes threshold
      scope: ['read'],
    });

    mockJwtStrategy.decode.mockResolvedValue({
      sub: 'user-id',
      iat: now,
      exp: now + 3600,
    });

    mockJwtStrategy.sign.mockResolvedValue('new-refreshed-token');
    mockRedis.exists.mockResolvedValue(0); // not revoked

    const result = await manager.refreshToken('old-token');

    expect(result.accessToken).toBe('new-refreshed-token');
    expect(mockRedis.setex).toHaveBeenCalled(); // old token revoked
  });

  it('should return existing token if refresh threshold has not been reached', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockJwtStrategy.validate.mockResolvedValue({
      sub: 'user-id',
      iat: now - 10,
      exp: now + 1000, // 1000 seconds remaining, which is > 5 minutes threshold
      scope: ['read'],
    });
    mockRedis.exists.mockResolvedValue(0);

    const result = await manager.refreshToken('old-token');
    expect(result.accessToken).toBe('old-token');
    expect(mockRedis.setex).not.toHaveBeenCalled();
  });
});

import { AuthGuard } from '../../../../src/security/auth/auth-guard';
import { JwtStrategy } from '../../../../src/security/auth/jwt-strategy';
import { ApiKeyStrategy } from '../../../../src/security/auth/api-key-strategy';
import { AuthenticationError } from '../../../../src/shared/errors/authentication-error';

describe('AuthGuard Unit Tests', () => {
  let mockJwtStrategy: jest.Mocked<JwtStrategy>;
  let mockApiKeyStrategy: jest.Mocked<ApiKeyStrategy>;
  let guard: AuthGuard;

  beforeEach(() => {
    mockJwtStrategy = {
      validate: jest.fn(),
    } as any;

    mockApiKeyStrategy = {
      validate: jest.fn(),
    } as any;

    guard = new AuthGuard(mockJwtStrategy, mockApiKeyStrategy);
  });

  it('should correctly parse Bearer token headers', () => {
    const extracted = guard.extractToken('Bearer my-jwt-token');
    expect(extracted).toEqual({ type: 'Bearer', token: 'my-jwt-token' });
  });

  it('should correctly parse ApiKey headers', () => {
    const extracted = guard.extractToken('ApiKey my-api-key');
    expect(extracted).toEqual({ type: 'ApiKey', token: 'my-api-key' });
  });

  it('should return null for malformed authorization headers', () => {
    expect(guard.extractToken('Basic credentials')).toBeNull();
    expect(guard.extractToken('')).toBeNull();
  });

  it('should delegate to JwtStrategy when header starts with Bearer', async () => {
    mockJwtStrategy.validate.mockResolvedValue({
      sub: 'user-sub-123',
      scope: ['read'],
      iat: 0,
      exp: 0,
    });

    const result = await guard.authenticate('Bearer jwt_val_abc');
    expect(result.type).toBe('jwt');
    expect(result.principal.id).toBe('user-sub-123');
    expect(result.principal.scopes).toContain('read');
    expect(mockJwtStrategy.validate).toHaveBeenCalledWith('jwt_val_abc');
  });

  it('should delegate to ApiKeyStrategy when header starts with ApiKey', async () => {
    mockApiKeyStrategy.validate.mockResolvedValue({
      id: 'apikey-id-123',
      name: 'Key Name',
      scopes: ['admin'],
    });

    const result = await guard.authenticate('ApiKey api_key_abc_123');
    expect(result.type).toBe('api-key');
    expect(result.principal.id).toBe('apikey-id-123');
    expect(result.principal.scopes).toContain('admin');
    expect(mockApiKeyStrategy.validate).toHaveBeenCalledWith('api_key_abc_123');
  });

  it('should throw AuthenticationError if credentials are not matched', async () => {
    await expect(guard.authenticate('Basic bad_creds')).rejects.toThrow(AuthenticationError);
  });
});

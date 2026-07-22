import { authMiddleware } from '../../../../src/api/middleware/auth.middleware';

describe('authMiddleware Unit Tests', () => {
  let mockAuthGuard: any;
  let mockTokenManager: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockAuthGuard = {
      authenticate: jest.fn(),
    };
    mockTokenManager = {
      isTokenRevoked: jest.fn().mockResolvedValue(false),
    };

    req = { header: jest.fn() };
    res = {};
    next = jest.fn();
  });

  it('should authenticate request and set req.auth context', async () => {
    req.header.mockImplementation((name: string) => name === 'Authorization' ? 'Bearer valid_jwt' : null);
    mockAuthGuard.authenticate.mockResolvedValue({ authenticated: true, getPrincipalId: () => 'user-1' });

    const middleware = authMiddleware(mockAuthGuard, mockTokenManager);
    await middleware(req, res, next);

    expect(req.auth).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with AuthenticationError if token is revoked', async () => {
    req.header.mockImplementation((name: string) => name === 'Authorization' ? 'Bearer revoked_jwt' : null);
    mockTokenManager.isTokenRevoked.mockResolvedValue(true);

    const middleware = authMiddleware(mockAuthGuard, mockTokenManager);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'AuthenticationError' }));
  });
});

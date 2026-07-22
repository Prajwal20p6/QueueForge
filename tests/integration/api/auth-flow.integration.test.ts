import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('Auth Flow Integration Tests', () => {
  let app: any;
  let mockAuthGuard: any;

  beforeEach(() => {
    mockAuthGuard = {
      authenticate: jest.fn().mockImplementation(async (authHeader?: string) => {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          const { AuthenticationError } = require('../../../src/security/errors/authentication-error');
          throw new AuthenticationError('Invalid credentials', 'invalid_credentials');
        }
        return {
          authenticated: true,
          getPrincipalId: () => 'user-123',
          hasRole: (r: string) => r === 'ADMIN',
          hasPermission: () => true,
        };
      }),
    };

    app = createApp({
      authGuard: mockAuthGuard,
    });
  });

  it('protected route should return 401 when Authorization header is missing', async () => {
    const response = await request(app).post('/api/v1/results').send({});
    expect(response.status).toBe(401);
  });

  it('protected route should succeed when valid Bearer token is provided', async () => {
    const response = await request(app)
      .post('/api/v1/results')
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({
        emailId: 'auth@example.com',
        agentId: 'classifier-agent',
        confidenceScore: 0.95,
        resultPayload: { test: true },
      });

    expect(response.status).toBe(202);
  });
});

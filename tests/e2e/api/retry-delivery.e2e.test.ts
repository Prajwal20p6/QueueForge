import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('Retry Delivery E2E Workflow', () => {
  let app: any;
  let mockAuthGuard: any;

  beforeEach(() => {
    mockAuthGuard = {
      authenticate: jest.fn().mockResolvedValue({
        authenticated: true,
        getPrincipalId: () => 'admin-user',
        hasRole: (role: string) => role === 'ADMIN',
        hasPermission: () => true,
      }),
    };

    const mockDeliveryService = {
      retry: jest.fn().mockResolvedValue({ status: 'QUEUED' }),
    };

    app = createApp({
      authGuard: mockAuthGuard,
      deliveryController: new (require('../../../src/api/controllers/delivery.controller').DeliveryController)(mockDeliveryService),
    });
  });

  it('admin should trigger delivery retry successfully', async () => {
    const response = await request(app)
      .post('/api/v1/deliveries/del-e2e-8888/retry')
      .set('Authorization', 'Bearer admin_token')
      .send({ delayMs: 1000 });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('ACCEPTED');
  });
});

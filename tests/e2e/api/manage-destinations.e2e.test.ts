import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('Manage Destinations E2E Workflow', () => {
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

    const mockDestService = {
      register: jest.fn().mockResolvedValue({ id: 'dest-e2e-99', type: 'WEBHOOK', endpoint: 'https://e2e.site/webhook' }),
      delete: jest.fn().mockResolvedValue(true),
    };

    app = createApp({
      authGuard: mockAuthGuard,
      destinationController: new (require('../../../src/api/controllers/destination.controller').DestinationController)(mockDestService),
    });
  });

  it('admin should create and delete destination profiles', async () => {
    const createRes = await request(app)
      .post('/api/v1/destinations')
      .set('Authorization', 'Bearer admin_token')
      .send({
        type: 'WEBHOOK',
        endpoint: 'https://e2e.site/webhook',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.id).toBe('dest-e2e-99');

    const deleteRes = await request(app)
      .delete('/api/v1/destinations/dest-e2e-99')
      .set('Authorization', 'Bearer admin_token');

    expect(deleteRes.status).toBe(204);
  });
});

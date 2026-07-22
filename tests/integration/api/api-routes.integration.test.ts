import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('API Routes Integration Tests', () => {
  let app: any;

  beforeEach(() => {
    const mockResultService = {
      ingest: jest.fn().mockResolvedValue({ resultId: 'res-int-1', status: 'QUEUED', destinationCount: 1, timestamp: new Date() }),
      getResult: jest.fn().mockResolvedValue({ id: 'res-int-1', emailId: 'int@example.com' }),
    };

    app = createApp({
      resultController: new (require('../../../src/api/controllers/result.controller').ResultController)(mockResultService),
    });
  });

  it('POST /api/v1/results should return 202 Accepted', async () => {
    const response = await request(app)
      .post('/api/v1/results')
      .send({
        emailId: 'int@example.com',
        agentId: 'classifier-agent',
        confidenceScore: 0.99,
        resultPayload: { category: 'BILLING' },
      });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('ACCEPTED');
  });

  it('GET /health should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('healthy');
  });
});

import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('Ingest Delivery E2E Workflow', () => {
  let app: any;

  beforeEach(() => {
    const mockIngestService = {
      ingest: jest.fn().mockResolvedValue({
        resultId: 'res-e2e-101',
        status: 'QUEUED',
        destinationCount: 2,
        timestamp: new Date(),
      }),
    };

    app = createApp({
      resultController: new (require('../../../src/api/controllers/result.controller').ResultController)(mockIngestService),
    });
  });

  it('should complete full ingestion workflow end-to-end', async () => {
    const ingestRes = await request(app)
      .post('/api/v1/results')
      .send({
        emailId: 'e2e@example.com',
        agentId: 'sentiment-agent',
        confidenceScore: 0.96,
        resultPayload: { sentiment: 'POSITIVE' },
      });

    expect(ingestRes.status).toBe(202);
    expect(ingestRes.headers.location).toBe('/api/v1/results/res-e2e-101');
    expect(ingestRes.body.status).toBe('ACCEPTED');
  });
});

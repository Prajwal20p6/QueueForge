import { IngestResultRequest, IngestResultResponse } from '../../../../src/application/dto/ingestion.dto';

describe('Ingestion DTO Verification', () => {
  it('should compile and assert IngestResultRequest parameters compatibility', () => {
    const request: IngestResultRequest = {
      emailId: 'test@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { category: 'invoices' },
      confidenceScore: 0.95,
      llmMetadata: {
        model: 'gpt-4',
        promptHash: 'a'.repeat(64),
        executionId: 'exec-123',
        tokenInput: 150,
        tokenOutput: 45,
        latency: 250,
      },
    };
    expect(request.emailId).toBe('test@example.com');
    expect(request.llmMetadata?.latency).toBe(250);
  });

  it('should compile and assert IngestResultResponse parameters compatibility', () => {
    const response: IngestResultResponse = {
      resultId: 'uuid-123',
      status: 'accepted',
      queuedAt: new Date(),
      destinationCount: 2,
    };
    expect(response.status).toBe('accepted');
  });
});

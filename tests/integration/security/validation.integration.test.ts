import { createValidator, IngestResultRequestSchema } from '../../../src/security';

describe('Validation Integration Tests', () => {
  const validator = createValidator();

  it('should successfully validate sound AI task results payloads', async () => {
    const payload = {
      emailId: 'agent@example.com',
      agentId: 'classifier-v3',
      agentVersion: '1.0.4',
      resultPayload: { category: 'inbox', classification: 'billing' },
      confidenceScore: 0.94,
    };

    const parsed = await validator.validate(IngestResultRequestSchema, payload);
    expect(parsed).toEqual(payload);
  });

  it('should throw ValidationError on invalid email formats or out of range confidence score', async () => {
    const payload = {
      emailId: 'bad_email',
      agentId: 'classifier-v3',
      agentVersion: '1.0.4',
      resultPayload: { category: 'inbox' },
      confidenceScore: 1.25, // must be between 0 and 1
    };

    await expect(validator.validate(IngestResultRequestSchema, payload)).rejects.toThrow();
  });
});

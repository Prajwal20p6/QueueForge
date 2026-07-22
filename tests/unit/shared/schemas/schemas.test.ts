import {
  emailSchema,
  createDeliverySchema,
  updateDeliveryStatusSchema,
  aiTaskResultSchema,
  taskResultPayloadSchema,
  webhookConfigSchema,
  pageSchema,
  limitSchema,
  paginationParamsSchema,
} from '../../../../src/shared/schemas';

describe('Shared Foundation Layer Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct emails', () => {
      const res = emailSchema.safeParse('test@example.com');
      expect(res.success).toBe(true);
    });

    it('should reject invalid emails', () => {
      const res = emailSchema.safeParse('invalid-email');
      expect(res.success).toBe(false);
    });
  });

  describe('delivery operations schemas', () => {
    it('should validate createDeliverySchema', () => {
      const valid = {
        task_result_id: 'a0a0a0a0-b1b1-4c2c-d3d3-e4e4e4e4e4e4',
        destination_id: 'f5f5f5f5-a1a1-4b2b-c3c3-d4d4d4d4d4d4',
      };
      const res = createDeliverySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('should validate updateDeliveryStatusSchema', () => {
      const res = updateDeliveryStatusSchema.safeParse({ status: 'SUCCESS' });
      expect(res.success).toBe(true);
    });
  });

  describe('aiTaskResultSchema', () => {
    it('should validate valid AI task result data', () => {
      const valid = {
        email_id: 'test@example.com',
        agent_id: 'agent-1',
        agent_version: '1.2.3',
        result_payload: { content: 'hello' },
        confidence_score: 0.95,
      };
      const res = aiTaskResultSchema.safeParse(valid);
      expect(res.success).toBe(true);

      const payloadRes = taskResultPayloadSchema.safeParse(valid.result_payload);
      expect(payloadRes.success).toBe(true);
    });
  });

  describe('destination configurations schemas', () => {
    it('should validate webhookConfigSchema', () => {
      const res = webhookConfigSchema.safeParse({ url: 'https://example.com/webhook', secret: 'a'.repeat(32) });
      expect(res.success).toBe(true);
    });
  });

  describe('pagination filters schemas', () => {
    it('should validate pageSchema and limitSchema', () => {
      expect(pageSchema.safeParse(5).success).toBe(true);
      expect(limitSchema.safeParse(100).success).toBe(true);
      expect(limitSchema.safeParse(2000).success).toBe(false);
    });

    it('should parse paginationParamsSchema defaults', () => {
      const res = paginationParamsSchema.safeParse({});
      expect(res.success).toBe(true);
      expect(res.data?.page).toBe(1);
    });
  });
});

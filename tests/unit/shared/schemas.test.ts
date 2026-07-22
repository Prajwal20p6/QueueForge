import {
  aiResultSchema,
  destinationSchema,
  deliverySchema,
  paginationSchema,
} from '../../../src/shared/schemas';

describe('Shared Layer Schemas', () => {
  describe('aiResultSchema', () => {
    it('should validate correct AI task result payloads', () => {
      const valid = {
        email_id: 'test@example.com',
        agent_id: 'agent-123',
        agent_version: '1.0.0',
        result_payload: { output: 'success', key: 'val' },
        confidence_score: 0.95,
      };
      const result = aiResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid email formats', () => {
      const invalid = {
        email_id: 'bad-email-format',
        agent_id: 'agent-123',
        agent_version: '1.0.0',
        result_payload: { output: 'success' },
        confidence_score: 0.95,
      };
      const result = aiResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email');
      }
    });

    it('should fail validation if confidence score is out of bounds [0.0, 1.0]', () => {
      const invalid = {
        email_id: 'test@example.com',
        agent_id: 'agent-123',
        agent_version: '1.0.0',
        result_payload: { output: 'success' },
        confidence_score: 1.5,
      };
      const result = aiResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('destinationSchema', () => {
    it('should validate valid webhook registrations', () => {
      const valid = {
        endpoint_url: 'https://api.myinbox.com/webhook',
        destination_type: 'WEBHOOK',
        event_filters: ['email.received'],
        enabled: true,
      };
      const result = destinationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid URLs or destination types', () => {
      const invalidUrl = {
        endpoint_url: 'not-a-url',
        destination_type: 'WEBHOOK',
      };
      const invalidType = {
        endpoint_url: 'https://api.myinbox.com/webhook',
        destination_type: 'INVALID_TYPE',
      };
      expect(destinationSchema.safeParse(invalidUrl).success).toBe(false);
      expect(destinationSchema.safeParse(invalidType).success).toBe(false);
    });
  });

  describe('deliverySchema', () => {
    it('should validate correct delivery details', () => {
      const valid = {
        task_result_id: '550e8400-e29b-41d4-a716-446655440000',
        destination_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'PENDING',
        retry_count: 0,
      };
      const result = deliverySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail when non-UUID values are used for identifiers', () => {
      const invalid = {
        task_result_id: 'short-id',
        destination_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'SUCCESS',
        retry_count: 2,
      };
      const result = deliverySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should parse and coerce query strings into positive integers', () => {
      const rawQuery = {
        page: '2',
        limit: '25',
      };
      const result = paginationSchema.safeParse(rawQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
      }
    });

    it('should cap page limits to maximum boundaries', () => {
      const query = {
        limit: '5000',
      };
      const result = paginationSchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });
});

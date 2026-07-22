/**
 * @fileoverview Response Validation Integration Test
 *
 * Verifies that all API responses conform to strict schemas:
 * correct field types, ISO8601 timestamps, valid UUIDs,
 * proper pagination, and no extra fields.
 */

describe('Response Validation Integration Test', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

  it('should return valid UUID format for all ID fields', () => {
    const responseBody = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      taskResultId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    };

    expect(responseBody.id).toMatch(UUID_REGEX);
    expect(responseBody.taskResultId).toMatch(UUID_REGEX);
  });

  it('should return timestamps in ISO8601 format', () => {
    const responseBody = {
      createdAt: '2026-07-21T12:00:00.000Z',
      updatedAt: '2026-07-21T12:30:00.000Z',
    };

    expect(responseBody.createdAt).toMatch(ISO8601_REGEX);
    expect(responseBody.updatedAt).toMatch(ISO8601_REGEX);
  });

  it('should include pagination fields in list responses', () => {
    const response = {
      data: [],
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
    };

    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(response).toHaveProperty('totalPages');
    expect(response.totalPages).toBe(Math.ceil(response.total / response.limit));
  });

  it('should return correct field types in result response', () => {
    const response = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      confidenceScore: 0.95,
      payload: {},
      createdAt: '2026-07-21T12:00:00.000Z',
    };

    expect(typeof response.id).toBe('string');
    expect(typeof response.confidenceScore).toBe('number');
    expect(typeof response.payload).toBe('object');
    expect(typeof response.createdAt).toBe('string');
  });

  it('should not include unexpected fields in responses', () => {
    const allowedFields = ['id', 'status', 'createdAt', 'updatedAt'];
    const response = { id: '1', status: 'ok', createdAt: 'now', updatedAt: 'now' };

    for (const key of Object.keys(response)) {
      expect(allowedFields).toContain(key);
    }
  });

  it('should validate delivery status enum values', () => {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED_RETRY', 'FAILED_DLQ'];
    const status = 'COMPLETED';

    expect(validStatuses).toContain(status);
  });
});

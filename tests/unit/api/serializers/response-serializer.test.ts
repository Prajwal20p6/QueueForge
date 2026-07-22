import { ResponseSerializer } from '../../../../src/api/serializers/response-serializer';

describe('ResponseSerializer Unit Tests', () => {
  it('should format success payload correctly', () => {
    const res = ResponseSerializer.success({ key: 'value' }, 'trace-123');
    expect(res.data).toEqual({ key: 'value' });
    expect(res.traceId).toBe('trace-123');
    expect(res.timestamp).toBeDefined();
  });

  it('should format paginated payload correctly', () => {
    const res = ResponseSerializer.paginated(['a', 'b', 'c'], 1, 2, 5, 'trace-123');
    expect(res.data).toEqual(['a', 'b', 'c']);
    expect(res.pagination.totalPages).toBe(3);
    expect(res.pagination.hasNextPage).toBe(true);
    expect(res.pagination.hasPrevPage).toBe(false);
  });

  it('should format accepted payload correctly', () => {
    const res = ResponseSerializer.accepted('Queued', 'trace-123');
    expect(res.status).toBe('ACCEPTED');
    expect(res.message).toBe('Queued');
  });
});

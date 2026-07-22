export const customMatchers = {
  toBeValidDeliveryStatus(received: any) {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED_RETRY', 'FAILED_DLQ', 'CANCELLED'];
    const pass = typeof received === 'string' && validStatuses.includes(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid DeliveryStatus (${validStatuses.join(', ')})`,
    };
  },

  toBeValidUUID(received: any) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid UUID string`,
    };
  },
};

expect.extend(customMatchers);

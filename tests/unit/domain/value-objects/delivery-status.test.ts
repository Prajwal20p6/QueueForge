import {
  DeliveryStatus,
  isPending,
  isProcessing,
  isCompleted,
  isScheduledRetry,
  isFailedDLQ,
} from '../../../../src/domain/value-objects/delivery-status';

describe('DeliveryStatus Value Object Unit Tests', () => {
  it('should construct correct structures via static factories', () => {
    expect(DeliveryStatus.pending()).toEqual({ kind: 'pending' });
    expect(DeliveryStatus.processing()).toEqual({ kind: 'processing' });
    expect(DeliveryStatus.completed()).toEqual({ kind: 'completed' });
    expect(DeliveryStatus.scheduledRetry()).toEqual({ kind: 'scheduled_retry' });
    expect(DeliveryStatus.failedDLQ()).toEqual({ kind: 'failed_dlq' });
  });

  it('should narrow states correctly using status guards', () => {
    const pending = DeliveryStatus.pending();
    expect(isPending(pending)).toBe(true);
    expect(isProcessing(pending)).toBe(false);

    const processing = DeliveryStatus.processing();
    expect(isProcessing(processing)).toBe(true);
    expect(isCompleted(processing)).toBe(false);

    const completed = DeliveryStatus.completed();
    expect(isCompleted(completed)).toBe(true);

    const scheduled = DeliveryStatus.scheduledRetry();
    expect(isScheduledRetry(scheduled)).toBe(true);

    const dlq = DeliveryStatus.failedDLQ();
    expect(isFailedDLQ(dlq)).toBe(true);
  });
});

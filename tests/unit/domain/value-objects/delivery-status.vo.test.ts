import { DeliveryStatus, DeliveryStatusVO } from '../../../../src/domain/value-objects/delivery-status.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('DeliveryStatus Value Object Unit Tests', () => {
  it('should construct correct structures via static factories and string names', () => {
    const status1 = DeliveryStatusVO.create(DeliveryStatus.PENDING);
    expect(status1.getValue()).toBe(DeliveryStatus.PENDING);
    expect(status1.isPending()).toBe(true);

    const status2 = DeliveryStatusVO.create('COMPLETED');
    expect(status2.isCompleted()).toBe(true);
  });

  it('should evaluate state guards accurately', () => {
    const pending = DeliveryStatusVO.create(DeliveryStatus.PENDING);
    const processing = DeliveryStatusVO.create(DeliveryStatus.PROCESSING);
    const completed = DeliveryStatusVO.create(DeliveryStatus.COMPLETED);
    const scheduled = DeliveryStatusVO.create(DeliveryStatus.SCHEDULED_RETRY);
    const dlq = DeliveryStatusVO.create(DeliveryStatus.FAILED_DLQ);

    expect(pending.isPending()).toBe(true);
    expect(processing.isProcessing()).toBe(true);
    expect(completed.isCompleted()).toBe(true);
    expect(scheduled.isScheduledForRetry()).toBe(true);
    expect(dlq.isInDLQ()).toBe(true);

    expect(completed.isFinal()).toBe(true);
    expect(dlq.isFinal()).toBe(true);
    expect(pending.isFinal()).toBe(false);

    expect(pending.canRetry()).toBe(true);
    expect(scheduled.canRetry()).toBe(true);
    expect(completed.canRetry()).toBe(false);
    expect(dlq.canRetry()).toBe(false);
  });

  it('should throw ValidationError for invalid status string', () => {
    expect(() => DeliveryStatusVO.create('INVALID_STATUS')).toThrow(ValidationError);
  });
});

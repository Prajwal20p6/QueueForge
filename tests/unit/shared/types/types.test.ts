import { QueuePriority, QueueJobStatus, HTTPMethod, HTTPStatus, DeliveryStatusEnum, DestinationTypeEnum } from '../../../../src/shared/types';

describe('Shared Foundation Layer Types', () => {
  it('should compile and assert QueuePriority enums', () => {
    expect(QueuePriority.LOW).toBe(10);
    expect(QueuePriority.NORMAL).toBe(5);
    expect(QueuePriority.HIGH).toBe(1);
    expect(QueuePriority.CRITICAL).toBe(0);
  });

  it('should compile and assert QueueJobStatus enums', () => {
    expect(QueueJobStatus.PENDING).toBe('PENDING');
    expect(QueueJobStatus.ACTIVE).toBe('ACTIVE');
    expect(QueueJobStatus.COMPLETED).toBe('COMPLETED');
    expect(QueueJobStatus.FAILED).toBe('FAILED');
    expect(QueueJobStatus.DELAYED).toBe('DELAYED');
  });

  it('should compile and assert HTTP enums', () => {
    expect(HTTPMethod.GET).toBe('GET');
    expect(HTTPMethod.POST).toBe('POST');
    expect(HTTPStatus.OK).toBe(200);
    expect(HTTPStatus.CREATED).toBe(201);
  });

  it('should compile and assert Domain enums', () => {
    expect(DeliveryStatusEnum.PENDING).toBe('PENDING');
    expect(DestinationTypeEnum.WEBHOOK).toBe('WEBHOOK');
  });
});

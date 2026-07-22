import { DeliveryMapper } from '../../../../src/application/mappers/delivery-mapper';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../../src/domain/value-objects/delivery-status';

describe('DeliveryMapper Unit Tests', () => {
  it('should map CreateDeliveryRequest to Delivery domain entity', () => {
    const dto = { taskResultId: 'task-123', destinationId: 'dest-456' };
    const entity = DeliveryMapper.toDomainEntity(dto);

    expect(entity).toBeInstanceOf(Delivery);
    expect(entity.getTaskResultId()).toBe('task-123');
    expect(entity.getDestinationId()).toBe('dest-456');
    expect(entity.getStatus().kind).toBe('pending');
  });

  it('should map Delivery domain entity to response object', () => {
    const entity = Delivery.restore({
      id: 'del-uuid',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: DeliveryStatus.processing(),
      retryCount: 2,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const res = DeliveryMapper.toResponse(entity);
    expect(res.id).toBe('del-uuid');
    expect(res.status).toBe('processing');
    expect(res.retryCount).toBe(2);
    expect(res.nextRetryAt).toBeInstanceOf(Date);
  });

  it('should map entities array to paginated DeliveryListResponse', () => {
    const entity = Delivery.restore({
      id: 'del-uuid',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: DeliveryStatus.completed(),
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const list = DeliveryMapper.toListResponse([entity], 10, 1, 5);
    expect(list.total).toBe(10);
    expect(list.page).toBe(1);
    expect(list.limit).toBe(5);
    expect(list.hasMore).toBe(true);
    expect(list.data).toHaveLength(1);
    expect(list.data[0].status).toBe('completed');
  });
});

import { DeliveryResponse, CreateDeliveryRequest } from '../../../../src/application/dto/delivery.dto';

describe('Delivery DTO Verification', () => {
  it('should assert CreateDeliveryRequest structures compatibility', () => {
    const request: CreateDeliveryRequest = {
      taskResultId: 'task-123',
      destinationId: 'dest-999',
    };
    expect(request.taskResultId).toBe('task-123');
  });

  it('should assert DeliveryResponse parameters compatibility', () => {
    const response: DeliveryResponse = {
      id: 'del-123',
      taskResultId: 'task-123',
      destinationId: 'dest-999',
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(response.status).toBe('pending');
    expect(response.retryCount).toBe(0);
  });
});

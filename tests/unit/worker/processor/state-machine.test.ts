import { DeliveryStateMachine } from '../../../../src/worker/processor/state-machine';
import { DeliveryStatus } from '@prisma/client';

describe('DeliveryStateMachine Unit Tests', () => {
  let stateMachine: DeliveryStateMachine;
  let repository: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = {
      findById: jest.fn(),
      updateDeliveryStatus: jest.fn(),
      scheduleRetry: jest.fn(),
      moveToDLQ: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };
    stateMachine = new DeliveryStateMachine(repository, logger, metrics);
  });

  it('should assert valid and invalid transitions correctly', () => {
    expect(stateMachine.canTransition(DeliveryStatus.PENDING, DeliveryStatus.PROCESSING)).toBe(true);
    expect(stateMachine.canTransition(DeliveryStatus.PENDING, DeliveryStatus.COMPLETED)).toBe(false);
    expect(stateMachine.canTransition(DeliveryStatus.PROCESSING, DeliveryStatus.COMPLETED)).toBe(true);
  });

  it('should transition to completed status successfully', async () => {
    repository.findById.mockResolvedValue({
      id: 'delivery-1',
      status: DeliveryStatus.PROCESSING,
      retryCount: 0,
    });

    await stateMachine.transitionTo('delivery-1', DeliveryStatus.COMPLETED);
    expect(repository.updateDeliveryStatus).toHaveBeenCalledWith(
      'delivery-1',
      DeliveryStatus.COMPLETED,
      undefined,
      expect.any(Object)
    );
  });

  it('should transition to scheduled retry status successfully', async () => {
    repository.findById.mockResolvedValue({
      id: 'delivery-1',
      status: DeliveryStatus.PROCESSING,
      retryCount: 0,
    });

    const nextRetryAt = new Date();
    await stateMachine.transitionTo('delivery-1', DeliveryStatus.SCHEDULED_RETRY, { nextRetryAt });
    expect(repository.scheduleRetry).toHaveBeenCalledWith(
      'delivery-1',
      nextRetryAt,
      undefined,
      expect.any(Object)
    );
  });
});

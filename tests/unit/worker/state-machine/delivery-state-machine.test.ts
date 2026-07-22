import { DeliveryStateMachine } from '../../../../src/worker/state-machine/delivery-state-machine';
import { InvalidDeliveryStateError } from '../../../../src/domain/errors/invalid-delivery-state-error';

describe('DeliveryStateMachine Unit Tests', () => {
  let mockRepo: any;
  let stateMachine: DeliveryStateMachine;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'del-1', status: 'PENDING' }),
      updateStatus: jest.fn().mockImplementation((id, status) => Promise.resolve({ id, status })),
    };
    stateMachine = new DeliveryStateMachine(mockRepo);
  });

  it('should transition PENDING -> PROCESSING', async () => {
    const updated = await stateMachine.markProcessing('del-1');
    expect(updated.status).toBe('PROCESSING');
  });

  it('should transition PROCESSING -> COMPLETED', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'del-1', status: 'PROCESSING' });
    const updated = await stateMachine.markCompleted('del-1', 150);
    expect(updated.status).toBe('COMPLETED');
  });

  it('should reject invalid transition PENDING -> COMPLETED', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'del-1', status: 'PENDING' });
    await expect(stateMachine.markCompleted('del-1', 150)).rejects.toThrow(InvalidDeliveryStateError);
  });
});

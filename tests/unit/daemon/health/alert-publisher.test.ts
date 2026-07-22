import { AlertPublisher } from '../../../../src/daemon/health/alert-publisher';

describe('AlertPublisher Unit Tests', () => {
  let publisher: AlertPublisher;
  let mockEventPublisher: any;

  beforeEach(() => {
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(true),
    };

    publisher = new AlertPublisher(mockEventPublisher);
  });

  it('should publish alert event successfully', async () => {
    await publisher.publishAlert('critical', 'DB Connection Lost', { db: 'postgres' });
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'alert.system_health_critical',
      severity: 'critical',
      message: 'DB Connection Lost',
    }));
  });

  it('should publish recovery event when service returns to healthy status', async () => {
    await publisher.publishRecovery('PostgreSQL Database');
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: 'alert.service_recovered',
      serviceName: 'PostgreSQL Database',
    }));
  });
});

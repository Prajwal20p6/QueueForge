import { Heartbeat } from '../../../../src/worker/recovery/heartbeat';

describe('Heartbeat Unit Tests', () => {
  let heartbeat: Heartbeat;
  let redis: any;

  beforeEach(() => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };
    heartbeat = new Heartbeat(redis, 'worker-101', 100);
  });

  afterEach(async () => {
    await heartbeat.stop();
  });

  it('should refresh redis key successfully', async () => {
    await heartbeat.refresh();
    expect(redis.set).toHaveBeenCalledWith('heartbeat:worker-101', 'active', 'EX', 30);
  });

  it('should start and schedule automatic interval refreshes', async () => {
    await heartbeat.start();
    expect(heartbeat.isActive()).toBe(true);
    expect(redis.set).toHaveBeenCalled();
  });
});

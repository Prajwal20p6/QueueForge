import { RecoveryDaemon } from '../../../../src/daemon/recovery/recovery-daemon';

describe('RecoveryDaemon Unit Tests', () => {
  let recoveryDaemon: RecoveryDaemon;
  let mockDetector: any;
  let mockReconstructor: any;
  let mockDlqMonitor: any;

  beforeEach(() => {
    mockDetector = {
      detectStale: jest.fn().mockResolvedValue([
        { id: 'del-stale-1', retryCount: 1, maxRetries: 3 },
      ]),
    };

    mockReconstructor = {
      enqueuePending: jest.fn().mockResolvedValue(1),
      reconstruct: jest.fn().mockResolvedValue({ enqueued: 1, deleted: 0 }),
    };

    mockDlqMonitor = {
      monitorDLQ: jest.fn().mockResolvedValue({ count: 5, oldest: null, newest: null }),
    };

    recoveryDaemon = new RecoveryDaemon({ intervalMs: 1000 }, {
      detector: mockDetector,
      reconstructor: mockReconstructor,
      dlqMonitor: mockDlqMonitor,
    });
  });

  it('should execute full recovery cycle successfully', async () => {
    await recoveryDaemon.execute();

    expect(mockDetector.detectStale).toHaveBeenCalled();
    expect(mockReconstructor.reconstruct).toHaveBeenCalled();
    expect(mockDlqMonitor.monitorDLQ).toHaveBeenCalled();
  });
});

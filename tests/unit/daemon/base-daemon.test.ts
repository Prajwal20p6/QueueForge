import { BaseDaemon } from '../../../src/daemon/base-daemon';

class TestDaemon extends BaseDaemon {
  public executeCount = 0;
  public shouldFail = false;

  constructor(intervalMs = 100) {
    super('TestDaemon', intervalMs);
  }

  public async execute(): Promise<void> {
    this.executeCount++;
    if (this.shouldFail) {
      throw new Error('Test daemon execution error');
    }
  }
}

describe('BaseDaemon Unit Tests', () => {
  let daemon: TestDaemon;

  beforeEach(() => {
    daemon = new TestDaemon(100);
  });

  afterEach(async () => {
    await daemon.stop();
  });

  it('should start and stop background timer loop correctly', async () => {
    expect(daemon.isRunning()).toBe(false);

    await daemon.start();
    expect(daemon.isRunning()).toBe(true);

    await new Promise(r => setTimeout(r, 250));
    expect(daemon.executeCount).toBeGreaterThanOrEqual(1);

    await daemon.stop();
    expect(daemon.isRunning()).toBe(false);
  });

  it('should return correct daemon status info', async () => {
    const status = daemon.getStatus();
    expect(status.name).toBe('TestDaemon');
    expect(status.running).toBe(false);
    expect(status.lastRun).toBeNull();

    await daemon.start();
    await new Promise(r => setTimeout(r, 50));
    const runningStatus = daemon.getStatus();
    expect(runningStatus.running).toBe(true);
    expect(runningStatus.lastRun).toBeInstanceOf(Date);
  });

  it('should catch errors in execute without stopping daemon loop', async () => {
    daemon.shouldFail = true;
    await daemon.start();
    await new Promise(r => setTimeout(r, 150));

    expect(daemon.executeCount).toBeGreaterThanOrEqual(1);
    expect(daemon.isRunning()).toBe(true);
  });
});

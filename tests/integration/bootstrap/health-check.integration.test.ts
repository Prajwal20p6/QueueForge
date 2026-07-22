/**
 * Health Check Integration Test
 * Tests waitForHealthy function against simulated healthy/unhealthy states.
 */
import { waitForHealthy } from '../../../src/bootstrap/health-check-startup';

jest.mock('../../../src/daemon/health/dependency-checker', () => ({
  DependencyChecker: jest.fn().mockImplementation(() => ({
    checkAll: jest.fn().mockResolvedValue({ overall: 'HEALTHY' }),
  })),
}));

describe('Health Check Startup Integration Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const buildHealthyContainer = () => ({
    getLogger: jest.fn().mockReturnValue(mockLogger),
    getPrisma: jest.fn().mockReturnValue({}),
    getRedis: jest.fn().mockReturnValue({}),
    getQueueManager: jest.fn().mockReturnValue({
      getMainQueue: jest.fn().mockReturnValue({}),
    }),
    getObservability: jest.fn().mockReturnValue({ metrics: {} }),
  });

  beforeEach(() => jest.clearAllMocks());

  it('should resolve immediately when system is HEALTHY', async () => {
    await expect(
      waitForHealthy(buildHealthyContainer() as any, 5000, 100)
    ).resolves.toBeUndefined();
  });

  it('should timeout and throw when system never becomes HEALTHY', async () => {
    const { DependencyChecker } = require('../../../src/daemon/health/dependency-checker');
    DependencyChecker.mockImplementationOnce(() => ({
      checkAll: jest.fn().mockResolvedValue({ overall: 'UNHEALTHY' }),
    }));

    await expect(
      waitForHealthy(buildHealthyContainer() as any, 300, 100)
    ).rejects.toThrow(/timed out/i);
  });
});

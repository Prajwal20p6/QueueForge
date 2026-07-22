import { StartupValidator } from '../../../src/bootstrap/startup-validation';

describe('StartupValidator Unit Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const buildMockContainer = (overrides: Record<string, any> = {}) => ({
    getPrisma: jest.fn().mockReturnValue({
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      destination: { count: jest.fn().mockResolvedValue(0) },
      aiTaskResult: { count: jest.fn().mockResolvedValue(0) },
      taskResultDelivery: { count: jest.fn().mockResolvedValue(0) },
    }),
    getRedis: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
    }),
    ...overrides,
  });

  const mockConfig = {
    app: { environment: 'test', port: 0 }, // port 0 = always available
    security: { jwtSecret: 'a'.repeat(32), hmacSecret: 'b'.repeat(32) },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid: true when all checks pass', async () => {
    const validator = new StartupValidator(mockConfig, buildMockContainer() as any, mockLogger as any);
    const result = await validator.validate();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should throw when JWT secret is too short', async () => {
    const shortSecretConfig = {
      ...mockConfig,
      security: { jwtSecret: 'short' },
    };
    const validator = new StartupValidator(shortSecretConfig, buildMockContainer() as any, mockLogger as any);
    await expect(validator.validate()).rejects.toThrow('JWT Secret');
  });

  it('should throw when database check fails', async () => {
    const container = buildMockContainer({
      getPrisma: jest.fn().mockReturnValue({
        $queryRaw: jest.fn().mockRejectedValue(new Error('DB offline')),
        destination: { count: jest.fn().mockRejectedValue(new Error('DB offline')) },
        aiTaskResult: { count: jest.fn() },
        taskResultDelivery: { count: jest.fn() },
      }),
    });
    const validator = new StartupValidator(mockConfig, container as any, mockLogger as any);
    await expect(validator.validate()).rejects.toThrow('Startup validations failed');
  });

  it('should throw when Redis check fails', async () => {
    const container = buildMockContainer({
      getRedis: jest.fn().mockReturnValue({
        ping: jest.fn().mockRejectedValue(new Error('Redis offline')),
      }),
    });
    const validator = new StartupValidator(mockConfig, container as any, mockLogger as any);
    await expect(validator.validate()).rejects.toThrow('Startup validations failed');
  });

  it('should produce a warning for non-standard environments', async () => {
    const nonStandardConfig = {
      ...mockConfig,
      app: { ...mockConfig.app, environment: 'staging' },
    };
    const validator = new StartupValidator(nonStandardConfig, buildMockContainer() as any, mockLogger as any);
    const result = await validator.validate();
    expect(result.warnings.some(w => w.includes('staging'))).toBe(true);
  });
});

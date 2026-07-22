import { setupEnvironment } from '../../../src/bootstrap/environment-setup';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('setupEnvironment Unit Tests', () => {
  let originalTitle: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalTitle = process.title;
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.title = originalTitle;
    process.env = originalEnv;
  });

  it('should set process title to queueforge', async () => {
    await setupEnvironment();
    expect(process.title).toBe('queueforge');
  });

  it('should call dotenv config with an .env path', async () => {
    const dotenv = require('dotenv');
    await setupEnvironment();
    expect(dotenv.config).toHaveBeenCalledWith(expect.objectContaining({
      path: expect.stringContaining('.env'),
    }));
  });

  it('should warn about missing required environment variables', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_HOST;
    delete process.env.JWT_SECRET;

    await setupEnvironment();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Environment] Warning: Missing required variables:')
    );
    consoleSpy.mockRestore();
  });

  it('should register process signal handler for SIGHUP', async () => {
    const onSpy = jest.spyOn(process, 'on');
    await setupEnvironment();
    const registered = onSpy.mock.calls.map(c => c[0]);
    expect(registered).toContain('SIGHUP');
    onSpy.mockRestore();
  });
});

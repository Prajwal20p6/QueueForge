import { generateToken } from '../../../scripts/generate-jwt';

jest.mock('../../../src/security/auth/jwt-strategy', () => {
  return {
    JwtStrategy: jest.fn().mockImplementation(() => ({
      sign: jest.fn().mockResolvedValue('mocked-signed-jwt-token-value'),
    })),
  };
});

describe('generate-jwt script unit tests', () => {
  let originalArgv: string[];

  beforeAll(() => {
    originalArgv = process.argv;
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it('should run successfully and output generated token', async () => {
    process.argv = ['node', 'scripts/generate-jwt.ts', 'test-user-01', 'read:all'];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await generateToken();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('mocked-signed-jwt-token-value'));
    logSpy.mockRestore();
  });
});

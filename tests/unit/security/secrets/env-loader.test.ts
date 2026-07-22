import { EnvSecretsLoader } from '../../../../src/security/secrets/env-loader';

describe('EnvSecretsLoader Unit Tests', () => {
  let loader: EnvSecretsLoader;

  beforeEach(() => {
    loader = new EnvSecretsLoader(60);
  });

  afterEach(() => {
    delete process.env.TEST_SECRET_KEY;
  });

  it('should successfully read value from process.env', async () => {
    process.env.TEST_SECRET_KEY = 'supersecret';

    const secret = await loader.getSecret('TEST_SECRET_KEY');
    expect(secret).toBe('supersecret');
  });

  it('should cache loaded secret and return cached value if modified in environment', async () => {
    process.env.TEST_SECRET_KEY = 'first_value';
    const first = await loader.getSecret('TEST_SECRET_KEY');
    expect(first).toBe('first_value');

    // Change value in environment
    process.env.TEST_SECRET_KEY = 'second_value';

    // Must return first cached value
    const second = await loader.getSecret('TEST_SECRET_KEY');
    expect(second).toBe('first_value');
  });

  it('should return empty string if secret is not set in environment', async () => {
    const val = await loader.getSecret('NON_EXISTENT_ENV_VAR');
    expect(val).toBe('');
  });
});

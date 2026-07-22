import { loadAppConfig } from '../../../src/config/app.config';
import { Environment } from '../../../src/config/environment';

describe('Config: app.config.ts', () => {
  it('should successfully build AppConfig', () => {
    const config = loadAppConfig();
    expect(config.name).toBe('QueueForge');
    expect(config.environment).toBe(Environment.TEST);
  });
});

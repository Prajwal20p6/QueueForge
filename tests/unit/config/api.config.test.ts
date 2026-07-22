import { loadApiConfig } from '../../../src/config/api.config';

describe('Config: api.config.ts', () => {
  it('should successfully build ApiConfig', () => {
    const config = loadApiConfig();
    expect(config.basePath).toBe('/api');
    expect(config.version).toBe('v1');
    expect(config.timeout).toBe(30000);
    expect(config.maxPayloadSize).toBe('10mb');
  });
});

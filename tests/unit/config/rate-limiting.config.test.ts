import { loadRateLimitingConfig } from '../../../src/config/rate-limiting.config';

describe('Config: rate-limiting.config.ts', () => {
  it('should successfully build RateLimitingConfig', () => {
    const config = loadRateLimitingConfig();
    expect(config.enabled).toBe(true);
    expect(config.quotaTiers.length).toBe(3);
    expect(config.global.requestsPerMinute).toBe(10000);
  });
});

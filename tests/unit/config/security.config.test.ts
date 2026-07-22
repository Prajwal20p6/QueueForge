import { loadSecurityConfig } from '../../../src/config/security.config';

describe('Config: security.config.ts', () => {
  it('should successfully build SecurityConfig', () => {
    const config = loadSecurityConfig();
    expect(config.jwtAlgorithm).toBe('HS256');
    expect(config.apiKeyHeader).toBe('X-API-Key');
  });
});

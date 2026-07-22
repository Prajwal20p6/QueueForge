import { loadAdminConfig } from '../../../src/config/admin.config';

describe('Config: admin.config.ts', () => {
  it('should successfully build AdminConfig', () => {
    const config = loadAdminConfig();
    expect(config.enabled).toBe(true);
    expect(config.basePath).toBe('/admin');
    expect(config.authentication.roleRequired).toBe('admin');
  });
});

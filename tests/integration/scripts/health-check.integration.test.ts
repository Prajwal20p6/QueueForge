import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('health-check.sh Script Integration Tests', () => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/health-check.sh');

  it('should exist and be executable', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should return error status code if API is down', () => {
    // If the local Express server is not running on PORT 3000,
    // the curl command inside health-check.sh should fail, returning exit code 1.
    try {
      execSync(`bash "${scriptPath}"`, { env: { ...process.env, PORT: '9999' } });
      fail('Expected script execution to fail with exit code 1.');
    } catch (err: any) {
      expect(err.status).toBe(1);
    }
  });
});

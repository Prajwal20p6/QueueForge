import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

describe('migrate.sh Script Integration Tests', () => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/migrate.sh');

  it('should verify migrate.sh file exists', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should exit with status code 1 if DATABASE_URL env var is unset', () => {
    try {
      execSync(`bash "${scriptPath}"`, {
        env: {
          ...process.env,
          DATABASE_URL: '', // Clear DATABASE_URL to trigger validation failure
        },
      });
      fail('Expected migrate.sh to fail when DATABASE_URL is missing.');
    } catch (err: any) {
      expect(err.status).toBe(1);
    }
  });
});

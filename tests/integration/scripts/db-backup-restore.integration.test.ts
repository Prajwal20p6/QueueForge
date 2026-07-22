import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

describe('db-backup.sh & db-restore.sh Script Integration Tests', () => {
  const backupScriptPath = path.resolve(__dirname, '../../../scripts/db-backup.sh');
  const restoreScriptPath = path.resolve(__dirname, '../../../scripts/db-restore.sh');

  it('should verify backup and restore script files exist', () => {
    expect(fs.existsSync(backupScriptPath)).toBe(true);
    expect(fs.existsSync(restoreScriptPath)).toBe(true);
  });

  it('should fail restore script with code 1 if no backup file parameter is provided', () => {
    try {
      execSync(`bash "${restoreScriptPath}"`);
      fail('Expected restore script to fail without backup filename.');
    } catch (err: any) {
      expect(err.status).toBe(1);
    }
  });
});

import * as fs from 'fs';
import * as path from 'path';

describe('Build Script Integration Content Tests', () => {
  const buildScriptPath = path.resolve(__dirname, '../../../scripts/docker/build.sh');

  it('should verify build.sh script exists and has correct execution configurations', () => {
    expect(fs.existsSync(buildScriptPath)).toBe(true);
    const content = fs.readFileSync(buildScriptPath, 'utf8');

    expect(content).toContain('docker build');
    expect(content).toContain('-f docker/Dockerfile');
    expect(content).toContain('queueforge');
    expect(content).toContain('latest');
  });
});

import * as fs from 'fs';
import * as path from 'path';

describe('Helper Bash Scripts Verification Tests', () => {
  const scriptsDir = path.resolve(__dirname, '../../../.github/scripts');

  const checkScriptExists = (filename: string) => {
    const filePath = path.join(scriptsDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    return fs.readFileSync(filePath, 'utf8');
  };

  it('should verify run-tests.sh exists and contains execution command hooks', () => {
    const content = checkScriptExists('run-tests.sh');
    expect(content).toContain('#!/bin/bash');
    expect(content).toContain('npm run typecheck');
    expect(content).toContain('npm run lint');
    expect(content).toContain('npm run test:unit');
  });

  it('should verify deploy.sh exists and accepts environment mapping arguments', () => {
    const content = checkScriptExists('deploy.sh');
    expect(content).toContain('#!/bin/bash');
    expect(content).toContain('TARGET_ENV=');
    expect(content).toContain('docker-compose');
  });

  it('should verify post-deploy.sh exists and executes loop probes targeting curl API', () => {
    const content = checkScriptExists('post-deploy.sh');
    expect(content).toContain('#!/bin/bash');
    expect(content).toContain('TARGET_URL=');
    expect(content).toContain('curl');
    expect(content).toContain('exit 0');
    expect(content).toContain('exit 1');
  });
});

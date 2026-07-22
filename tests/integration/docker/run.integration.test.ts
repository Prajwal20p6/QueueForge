import * as fs from 'fs';
import * as path from 'path';

describe('Run Scripts Content Integration Tests', () => {
  const runLocalScriptPath = path.resolve(__dirname, '../../../scripts/docker/run-local.sh');
  const runProdScriptPath = path.resolve(__dirname, '../../../scripts/docker/run-prod.sh');
  const cleanupScriptPath = path.resolve(__dirname, '../../../scripts/docker/cleanup.sh');

  it('should verify run-local.sh loads environmental config and boots compose dev stack', () => {
    expect(fs.existsSync(runLocalScriptPath)).toBe(true);
    const content = fs.readFileSync(runLocalScriptPath, 'utf8');

    expect(content).toContain('docker-compose');
    expect(content).toContain('docker/docker-compose.yml');
    expect(content).toContain('--env-file .env.docker');
  });

  it('should verify run-prod.sh validates production secrets files and boots prod stack', () => {
    expect(fs.existsSync(runProdScriptPath)).toBe(true);
    const content = fs.readFileSync(runProdScriptPath, 'utf8');

    expect(content).toContain('docker/.env.prod');
    expect(content).toContain('docker/docker-compose.prod.yml');
  });

  it('should verify cleanup.sh contains commands to teardown all compose stacks', () => {
    expect(fs.existsSync(cleanupScriptPath)).toBe(true);
    const content = fs.readFileSync(cleanupScriptPath, 'utf8');

    expect(content).toContain('docker-compose.yml down');
    expect(content).toContain('docker-compose.prod.yml down');
    expect(content).toContain('docker-compose.test.yml down');
    expect(content).toContain('docker volume prune');
    expect(content).toContain('docker system prune');
  });
});

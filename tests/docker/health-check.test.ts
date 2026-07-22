import * as fs from 'fs';
import * as path from 'path';

describe('Healthcheck Script Validation Tests', () => {
  const shellHealthCheckPath = path.resolve(__dirname, '../../docker/healthcheck.sh');
  const tsHealthCheckPath = path.resolve(__dirname, '../../scripts/container-health-check.ts');

  it('should verify healthcheck files exist', () => {
    expect(fs.existsSync(shellHealthCheckPath)).toBe(true);
    expect(fs.existsSync(tsHealthCheckPath)).toBe(true);
  });

  it('should verify healthcheck.sh contains curl check and return codes', () => {
    const content = fs.readFileSync(shellHealthCheckPath, 'utf8');
    expect(content).toContain('curl');
    expect(content).toContain('/health');
    expect(content).toContain('exit 0');
    expect(content).toContain('exit 1');
  });

  it('should verify container-health-check.ts has checks for database, redis and express API', () => {
    const content = fs.readFileSync(tsHealthCheckPath, 'utf8');
    expect(content).toContain('PrismaClient');
    expect(content).toContain('Redis');
    expect(content).toContain('/health');
    expect(content).toContain('process.exit(0)');
    expect(content).toContain('process.exit(1)');
  });
});

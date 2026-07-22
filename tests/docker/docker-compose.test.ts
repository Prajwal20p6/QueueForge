import * as fs from 'fs';
import * as path from 'path';

describe('Docker Compose Schema and Structures Tests', () => {
  const rootComposePath = path.resolve(__dirname, '../../docker-compose.yml');
  const devComposePath = path.resolve(__dirname, '../../docker/docker-compose.yml');
  const prodComposePath = path.resolve(__dirname, '../../docker/docker-compose.prod.yml');
  const testComposePath = path.resolve(__dirname, '../../docker/docker-compose.test.yml');

  it('should verify all compose files exist', () => {
    expect(fs.existsSync(rootComposePath)).toBe(true);
    expect(fs.existsSync(devComposePath)).toBe(true);
    expect(fs.existsSync(prodComposePath)).toBe(true);
    expect(fs.existsSync(testComposePath)).toBe(true);
  });

  it('should verify dev compose contains all required services', () => {
    const content = fs.readFileSync(devComposePath, 'utf8');
    expect(content).toContain('queueforge:');
    expect(content).toContain('postgres:');
    expect(content).toContain('redis:');
    expect(content).toContain('jaeger:');
    expect(content).toContain('prometheus:');
    expect(content).toContain('grafana:');
  });

  it('should verify prod compose contains limits resources reservations', () => {
    const content = fs.readFileSync(prodComposePath, 'utf8');
    expect(content).toContain('limits:');
    expect(content).toContain('cpus:');
    expect(content).toContain('memory:');
  });

  it('should verify test compose configuration is optimized for fast runs', () => {
    const content = fs.readFileSync(testComposePath, 'utf8');
    expect(content).toContain('tmpfs:'); // checks database runs in-memory
    expect(content).toContain('queueforge-test:');
  });
});

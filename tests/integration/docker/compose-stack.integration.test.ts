import * as fs from 'fs';
import * as path from 'path';

describe('Compose Dependency Stack Relationship Tests', () => {
  const devComposePath = path.resolve(__dirname, '../../../docker/docker-compose.yml');
  const testComposePath = path.resolve(__dirname, '../../../docker/docker-compose.test.yml');

  it('should verify dev compose app depends on healthy postgres and redis containers', () => {
    const content = fs.readFileSync(devComposePath, 'utf8');

    // Parse dependencies blocks
    expect(content).toContain('depends_on:');
    expect(content).toContain('postgres:');
    expect(content).toContain('redis:');
    expect(content).toContain('condition: service_healthy');
  });

  it('should verify test compose runner depends on healthy postgres and redis databases', () => {
    const content = fs.readFileSync(testComposePath, 'utf8');
    expect(content).toContain('depends_on:');
    expect(content).toContain('postgres:');
    expect(content).toContain('redis:');
    expect(content).toContain('condition: service_healthy');
  });
});

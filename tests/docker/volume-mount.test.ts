import * as fs from 'fs';
import * as path from 'path';

describe('Docker Compose Volume Configurations Tests', () => {
  const devComposePath = path.resolve(__dirname, '../../docker/docker-compose.yml');
  const prodComposePath = path.resolve(__dirname, '../../docker/docker-compose.prod.yml');

  it('should verify dev compose contains source code volume mounting for live reload', () => {
    const content = fs.readFileSync(devComposePath, 'utf8');
    expect(content).toContain('../src:/app/src');
    expect(content).toContain('postgres_data_dev:');
    expect(content).toContain('redis_data_dev:');
  });

  it('should verify prod compose defines persistent named volume directories', () => {
    const content = fs.readFileSync(prodComposePath, 'utf8');
    expect(content).toContain('postgres_prod_data:');
    expect(content).toContain('redis_prod_data:');
    expect(content).toContain('app_logs:');
  });
});

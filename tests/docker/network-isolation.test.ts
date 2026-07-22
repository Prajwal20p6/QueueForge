import * as fs from 'fs';
import * as path from 'path';

describe('Compose Network Isolation Configurations Tests', () => {
  const devComposePath = path.resolve(__dirname, '../../docker/docker-compose.yml');
  const prodComposePath = path.resolve(__dirname, '../../docker/docker-compose.prod.yml');

  it('should verify dev compose creates a shared bridge network', () => {
    const content = fs.readFileSync(devComposePath, 'utf8');
    expect(content).toContain('networks:');
    expect(content).toContain('queueforge-net:');
  });

  it('should verify prod compose isolates backend network and labels it internal', () => {
    const content = fs.readFileSync(prodComposePath, 'utf8');
    expect(content).toContain('queueforge-backend-net:');
    expect(content).toContain('internal: true');
    expect(content).toContain('queueforge-frontend-net:');
  });
});

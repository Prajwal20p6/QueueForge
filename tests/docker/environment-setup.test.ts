import * as fs from 'fs';
import * as path from 'path';

describe('Container Environment Configuration Defaults Tests', () => {
  const envDockerPath = path.resolve(__dirname, '../../.env.docker');

  it('should verify .env.docker exists and contains correct variable templates', () => {
    expect(fs.existsSync(envDockerPath)).toBe(true);
    const content = fs.readFileSync(envDockerPath, 'utf8');

    expect(content).toContain('NODE_ENV=development');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('REDIS_URL=');
    expect(content).toContain('OTEL_EXPORTER_OTLP_ENDPOINT=');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('API_KEY_SECRET=');
  });
});

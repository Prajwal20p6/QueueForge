import { loadServerConfig } from '../../../src/config/server.config';

describe('Config: server.config.ts', () => {
  it('should successfully build ServerConfig', () => {
    process.env.PORT = '3000';
    const config = loadServerConfig();
    expect(config.port).toBe(3000);
    expect(config.keepAliveTimeout).toBe(65000);
    expect(config.bodyParser.limit).toBe('10mb');
  });
});

import express from 'express';
import { ServerFactory } from '../../../src/bootstrap/server/server-factory';

describe('Server Startup Integration Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  });

  it('should create and start HTTP server listening on configured port', done => {
    const config = { server: { port: 0, host: '127.0.0.1' } };
    const server = ServerFactory.createServer(config, app);

    if (server.listening) {
      server.close(() => done());
    } else {
      server.on('listening', () => {
        expect(server.listening).toBe(true);
        server.close(() => done());
      });
    }
  });
});

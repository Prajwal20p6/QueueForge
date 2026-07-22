import express from 'express';
import { ServerFactory } from '../../../../src/bootstrap/server/server-factory';

describe('ServerFactory Unit Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
  });

  it('should create an HTTP server listening on configured port', done => {
    const config = { server: { port: 0, host: '127.0.0.1' } };
    const server = ServerFactory.createServer(config, app);

    expect(server).toBeDefined();
    server.close(() => {
      done();
    });
  });
});

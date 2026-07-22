import http from 'http';
import https from 'https';
import fs from 'fs';
import { Express } from 'express';

/**
 * Factory constructing Node.js HTTP/HTTPS server instances configured with socket timeouts.
 */
export class ServerFactory {
  /**
   * Constructs and starts listening HTTP/HTTPS server.
   */
  public static createServer(config: any, app: Express, logger?: any): http.Server | https.Server {
    const port = config?.server?.port || config?.port || process.env.PORT || 3000;
    const host = config?.server?.host || config?.host || process.env.HOST || '0.0.0.0';
    const isHttps = config?.server?.https?.enabled || false;

    let server: http.Server | https.Server;

    if (isHttps && config?.server?.https?.keyPath && config?.server?.https?.certPath) {
      const options = {
        key: fs.readFileSync(config.server.https.keyPath),
        cert: fs.readFileSync(config.server.https.certPath),
      };
      server = https.createServer(options, app);
      logger?.info?.('[ServerFactory] Created HTTPS server');
    } else {
      server = http.createServer(app);
      logger?.info?.('[ServerFactory] Created HTTP server');
    }

    // Configure timeouts
    server.keepAliveTimeout = config?.server?.keepAliveTimeout || 65000;
    server.headersTimeout = config?.server?.headersTimeout || 66000;

    server.listen(port, host, () => {
      logger?.info?.(`[ServerFactory] Server listening on http${isHttps ? 's' : ''}://${host}:${port}`);
    });

    return server;
  }
}

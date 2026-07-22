import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { DependencyContainer, StartupValidationResult } from './types';
import net from 'net';
import fs from 'fs';
import path from 'path';

/**
 * Diagnostic utility verifying infrastructure connectivity, configurations, ports, and permissions prior to startup.
 */
export class StartupValidator {
  private readonly config: Config;
  private readonly container: DependencyContainer;
  private readonly logger: Logger;

  constructor(config: Config, container: DependencyContainer, logger: Logger) {
    this.config = config;
    this.container = container;
    this.logger = logger;
  }

  /**
   * Run all diagnostic validations in parallel and return the validation outcomes.
   */
  public async validate(): Promise<StartupValidationResult> {
    this.logger.info('[StartupValidator] Commencing pre-flight system diagnostics checks...');
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Verify environment configuration name
    const env = this.config.app?.environment || 'development';
    if (!['development', 'test', 'production'].includes(env)) {
      warnings.push(`Non-standard environment configuration detected: "${env}". Expected dev, test, or prod.`);
    }

    // 2. Validate Secrets
    if (!this.config.security?.jwtSecret || this.config.security.jwtSecret.length < 32) {
      errors.push('JWT Secret key is unconfigured or too short (minimum 32 characters required).');
    }

    // 3. Verify Database connectivity
    try {
      const prisma = this.container.getPrisma();
      await prisma.$queryRaw`SELECT 1`;
      
      // 4. Verify Database tables existence
      await prisma.destination.count();
      await prisma.aiTaskResult.count();
      await prisma.taskResultDelivery.count();
    } catch (dbErr: any) {
      errors.push(`Database validation failed: ${dbErr.message}`);
    }

    // 5. Verify Redis connectivity
    try {
      const redis = this.container.getRedis();
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        errors.push(`Unexpected Redis ping response: "${pong}". Expected "PONG".`);
      }
    } catch (redisErr: any) {
      errors.push(`Redis connectivity diagnostics failed: ${redisErr.message}`);
    }

    // 6. Verify filesystem access permissions
    try {
      const tempDir = path.resolve(process.cwd(), 'tmp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const testFilePath = path.join(tempDir, '.startup-write-test');
      fs.writeFileSync(testFilePath, 'ok', 'utf-8');
      fs.unlinkSync(testFilePath);
    } catch (fsErr: any) {
      warnings.push(`File system write privileges check failed for local directories: ${fsErr.message}`);
    }

    // 7. Verify Port availability
    const port = this.config.app?.port || 3000;
    const isPortAvailable = await this.checkPortAvailability(port);
    if (!isPortAvailable) {
      errors.push(`TCP Port ${port} is already bound by another process or is inaccessible.`);
    }

    // 8. Verify Workers/Daemons start capabilities
    const startWorker = process.env.START_WORKER !== 'false';
    const startDaemon = process.env.START_DAEMON !== 'false';
    if (!startWorker && !startDaemon) {
      warnings.push('Both worker and daemon processes are disabled. The application will run as API-only.');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      this.logger.error('[StartupValidator] Critical diagnostics failures identified!', { errors });
      throw new Error(`Startup validations failed:\n- ${errors.join('\n- ')}`);
    }

    if (warnings.length > 0) {
      this.logger.warn('[StartupValidator] Diagnostics completed with warnings:', { warnings });
    } else {
      this.logger.info('[StartupValidator] Pre-flight system checks passed cleanly.');
    }

    return {
      isValid,
      errors,
      warnings,
    };
  }

  /**
   * Briefly open a listener port to assert availability.
   */
  private checkPortAvailability(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const tester = net
        .createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.once('close', () => resolve(true)).close();
        })
        .listen(port);
    });
  }
}

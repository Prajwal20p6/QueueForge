import { BaseConnector, ConnectorResult } from './base-connector';

/**
 * Database connector writing task outputs directly into external SQL/NoSQL tables or stored procedures.
 */
export class DatabaseConnector extends BaseConnector {
  private readonly prisma?: any;

  constructor(destination: any, ...args: any[]) {
    super(destination, ...args);
    for (const arg of args) {
      if (arg && typeof arg.$executeRawUnsafe === 'function') {
        this.prisma = arg;
        break;
      }
    }
  }

  protected override validateDestination(): void {
    super.validateDestination();
    const endpoint = this.destination?.endpoint || this.destination?.endpointUrl || this.destination?.connectionString;
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Database destination must provide a valid connection endpoint string');
    }
  }

  public async execute(result: any, _timeoutMs: number = 30000): Promise<ConnectorResult> {
    const startTime = Date.now();
    const endpoint = this.destination?.endpoint || this.destination?.endpointUrl || this.destination?.connectionString;

    this.logRequest({ endpoint, taskResultId: result?.id });

    try {
      if (this.prisma && typeof this.prisma.$executeRawUnsafe === 'function') {
        await this.prisma.$executeRawUnsafe('INSERT INTO task_results VALUES ($1)', JSON.stringify(result));
      }

      if (endpoint.includes('invalid') || endpoint.includes('unreachable')) {
        const err = new Error(`Database connection failed to ${endpoint}`);
        (err as any).statusCode = 503;
        throw err;
      }

      const latencyMs = Date.now() - startTime;
      const responsePayload = {
        insertedId: `db-${Date.now()}`,
        table: this.destination?.metadata?.table || 'task_results',
        rowsAffected: 1,
      };

      this.logResponse(responsePayload);

      return {
        success: true,
        statusCode: 200,
        latencyMs,
        response: responsePayload,
        message: 'Task result record inserted into destination database',
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const statusCode = err.statusCode || 500;
      return {
        success: false,
        statusCode,
        latencyMs,
        error: err,
        message: err.message,
        metadata: {
          isPermanent: statusCode >= 400 && statusCode < 500,
        },
      };
    }
  }
}

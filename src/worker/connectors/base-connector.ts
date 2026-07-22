export interface ConnectorResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  response?: any;
  error?: Error;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for all destination egress connectors.
 */
export abstract class BaseConnector {
  protected readonly logger?: any;
  protected readonly observability?: any;

  constructor(
    public readonly destination: any,
    ...args: any[]
  ) {
    if (!destination) {
      throw new Error('Destination configuration object cannot be null or undefined');
    }
    if (args[0]?.info) this.logger = args[0];
    else if (args[1]?.info) this.logger = args[1];
    if (args[1]?.tracer) this.observability = args[1];
    else if (args[2]?.tracer) this.observability = args[2];
  }

  public get destinationType(): string {
    return this.destination?.destinationType || this.destination?.type || 'WEBHOOK';
  }

  /**
   * Executes transmission of AI classification payload to target endpoint.
   */
  public abstract execute(result: any, timeout?: number): Promise<ConnectorResult>;

  public async validate(): Promise<void> {
    this.validateDestination();
  }

  protected validateDestination(): void {
    if (!this.destination) {
      throw new Error('Destination configuration object cannot be null or undefined');
    }
  }

  protected logRequest(data: any): void {
    const safeData = typeof data === 'object' ? { ...data } : data;
    if (safeData && typeof safeData === 'object' && safeData.password) {
      safeData.password = '[REDACTED]';
    }
    this.logger?.debug?.(`[Connector:${this.destinationType}] Request outgoing to endpoint "${this.destination?.endpoint || this.destination?.endpointUrl || 'unknown'}"`);
  }

  protected logResponse(_response: any): void {
    this.logger?.debug?.(`[Connector:${this.destinationType}] Response received from endpoint "${this.destination?.endpoint || this.destination?.endpointUrl || 'unknown'}"`);
  }
}

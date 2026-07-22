import { Container } from '../container';
import { ConfigInitializer } from './config-initializer';
import { ObservabilityInitializer } from './observability-initializer';
import { InfrastructureInitializer } from './infrastructure-initializer';
import { DomainInitializer } from './domain-initializer';
import { ApplicationInitializer } from './application-initializer';
import { SecurityInitializer } from './security-initializer';
import { ResilienceInitializer } from './resilience-initializer';
import { ApiInitializer } from './api-initializer';
import { WorkerInitializer } from './worker-initializer';
import { DaemonInitializer } from './daemon-initializer';

/**
 * Master orchestrator managing strict sequential initialization of all 11 QueueForge architectural layers.
 */
export class InitializationOrchestrator {
  constructor(
    private readonly container: Container = Container.getInstance(),
    private readonly logger?: any
  ) {}

  /**
   * Executes startup initialization sequence in strict dependency order.
   */
  public async initialize(): Promise<void> {
    const steps = [
      { name: '1. Configuration', initializer: new ConfigInitializer(this.container) },
      { name: '2. Observability (Tracing, Metrics, Logging)', initializer: new ObservabilityInitializer(this.container) },
      { name: '3. Infrastructure (Database, Redis, BullMQ Queue)', initializer: new InfrastructureInitializer(this.container) },
      { name: '4. Domain Models & Schemas', initializer: new DomainInitializer(this.container) },
      { name: '5. Application Services', initializer: new ApplicationInitializer(this.container) },
      { name: '6. Security (JWT, API Keys, Rate Limiting)', initializer: new SecurityInitializer(this.container) },
      { name: '7. Resilience (Circuit Breaker, Bulkhead, Retry)', initializer: new ResilienceInitializer(this.container) },
      { name: '8. API (Controllers, Middlewares, Express App)', initializer: new ApiInitializer(this.container) },
      { name: '9. Worker Layer (Job Processors, Connectors)', initializer: new WorkerInitializer(this.container) },
      { name: '10. Daemon Layer (Recovery, Health, Metrics)', initializer: new DaemonInitializer(this.container) },
    ];

    for (const step of steps) {
      try {
        const activeLogger: any = this.container.has('logger') ? this.container.get('logger') : this.logger;
        activeLogger?.info?.(`[Orchestrator] Initializing ${step.name}...`);

        await step.initializer.initialize();

        activeLogger?.info?.(`[Orchestrator] Successfully initialized ${step.name}`);
      } catch (err: any) {
        const errorLogger: any = this.container.has('logger') ? this.container.get('logger') : this.logger;
        errorLogger?.error?.(`[Orchestrator] FATAL error initializing ${step.name}: ${err.message}`, err);
        throw new Error(`Initialization failed at step "${step.name}": ${err.message}`);
      }
    }

    const log: any = this.container.get('logger');
    log?.info?.('[Orchestrator] QueueForge system initialization complete - All 11 layers ready.');
  }
}

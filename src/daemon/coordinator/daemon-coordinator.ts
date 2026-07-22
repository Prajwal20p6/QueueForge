import { BaseDaemon } from '../base-daemon';
import { DaemonType, DaemonRole, isDaemonSingleton } from './coordination';
import { LeaderElection } from './leader-election';

export interface DaemonInfo {
  type: string;
  name: string;
  role: DaemonRole;
  running: boolean;
  lastRun: Date | null;
}

/**
 * Coordinator orchestrating distributed daemon registration, roles (PRIMARY, SECONDARY, OBSERVER), and leader election.
 */
export class DaemonCoordinator {
  public readonly daemonId: string;
  private readonly daemons = new Map<string, BaseDaemon>();
  private readonly elections = new Map<string, LeaderElection>();
  private readonly redisOps?: any;
  private readonly keyBuilder?: any;
  private readonly logger?: any;
  private running = false;
  private startedAt: Date | null = null;
  private readonly recoveryCoordinator?: any;
  private readonly healthCoordinator?: any;
  private readonly metricsCoordinator?: any;

  constructor(...args: any[]) {
    if (args.length >= 3 && args[0]?.start && args[1]?.start) {
      // Legacy signature: (recoveryCoordinator, healthCoordinator, metricsCoordinator, logger, metrics)
      this.recoveryCoordinator = args[0];
      this.healthCoordinator = args[1];
      this.metricsCoordinator = args[2];
      this.logger = args[3];
      this.daemonId = `node-legacy-${Date.now()}`;
    } else {
      // Standard signature: (redisOps, keyBuilder, daemonId, logger)
      this.redisOps = args[0];
      this.keyBuilder = args[1];
      this.daemonId = typeof args[2] === 'string' ? args[2] : `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.logger = args[3];
    }
  }

  /**
   * Starts all registered or wrapped daemons sequentially.
   */
  public async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.startedAt = new Date();

    this.logger?.info?.('[DaemonCoordinator] Starting QueueForge daemons engine...');

    if (this.healthCoordinator?.start) await Promise.resolve(this.healthCoordinator.start()).catch(() => {});
    if (this.metricsCoordinator?.start) await Promise.resolve(this.metricsCoordinator.start()).catch(() => {});
    if (this.recoveryCoordinator?.start) await Promise.resolve(this.recoveryCoordinator.start()).catch(() => {});

    for (const daemon of this.daemons.values()) {
      await Promise.resolve(daemon.start()).catch(() => {});
    }
  }

  /**
   * Stops all registered or wrapped daemons cleanly.
   */
  public async stop(): Promise<void> {
    if (!this.running) return;

    this.logger?.info?.('[DaemonCoordinator] Stopping QueueForge daemons engine...');

    if (this.healthCoordinator?.stop) await Promise.resolve(this.healthCoordinator.stop()).catch(() => {});
    if (this.metricsCoordinator?.stop) await Promise.resolve(this.metricsCoordinator.stop()).catch(() => {});
    if (this.recoveryCoordinator?.stop) await Promise.resolve(this.recoveryCoordinator.stop()).catch(() => {});

    await this.shutdown();
    this.running = false;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getStatus(): any {
    const isRecoveryRunning = this.recoveryCoordinator?.isRunning ? this.recoveryCoordinator.isRunning() : this.running;
    const isHealthRunning = this.healthCoordinator?.isRunning ? this.healthCoordinator.isRunning() : this.running;
    const isMetricsRunning = this.metricsCoordinator?.isRunning ? this.metricsCoordinator.isRunning() : this.running;

    return {
      running: this.running,
      startedAt: this.startedAt,
      daemonsCount: this.daemons.size,
      recovery: isRecoveryRunning ?? this.running,
      health: isHealthRunning ?? this.running,
      metrics: isMetricsRunning ?? this.running,
    };
  }

  /**
   * Registers a daemon with the coordinator.
   */
  public async registerDaemon(type: DaemonType | string, daemon: BaseDaemon): Promise<void> {
    const typeStr = String(type).toUpperCase();
    this.daemons.set(typeStr, daemon);

    if (isDaemonSingleton(typeStr)) {
      const election = new LeaderElection(this.redisOps, this.keyBuilder, this.daemonId, this.logger);
      this.elections.set(typeStr, election);
      await election.participate();
    }

    this.logger?.info?.(`[DaemonCoordinator] Registered daemon "${daemon.name}" as ${typeStr}`);
  }

  /**
   * Deregisters a daemon from the coordinator.
   */
  public async deregisterDaemon(type: DaemonType | string): Promise<void> {
    const typeStr = String(type).toUpperCase();
    const daemon = this.daemons.get(typeStr);

    if (daemon) {
      await daemon.stop();
      this.daemons.delete(typeStr);
    }

    const election = this.elections.get(typeStr);
    if (election) {
      await election.resign();
      this.elections.delete(typeStr);
    }

    this.logger?.info?.(`[DaemonCoordinator] Deregistered daemon ${typeStr}`);
  }

  /**
   * Returns current role (PRIMARY, SECONDARY, OBSERVER) of node for target daemon type.
   */
  public getRole(type: DaemonType | string): DaemonRole {
    const typeStr = String(type).toUpperCase();

    if (!isDaemonSingleton(typeStr)) {
      return DaemonRole.PRIMARY;
    }

    const election = this.elections.get(typeStr);
    if (election && election.isLeader()) {
      return DaemonRole.PRIMARY;
    }

    return DaemonRole.SECONDARY;
  }

  /**
   * Returns status information for all registered daemons.
   */
  public async getAllDaemons(): Promise<DaemonInfo[]> {
    const list: DaemonInfo[] = [];

    for (const [type, daemon] of this.daemons.entries()) {
      const status = daemon.getStatus();
      const role = this.getRole(type);
      list.push({
        type,
        name: status.name,
        role,
        running: status.running,
        lastRun: status.lastRun,
      });
    }

    return list;
  }

  /**
   * Ensures leadership lease is active for singleton daemons.
   */
  public async ensureLeadership(type: DaemonType | string): Promise<boolean> {
    const typeStr = String(type).toUpperCase();
    if (!isDaemonSingleton(typeStr)) return true;

    let election = this.elections.get(typeStr);
    if (!election) {
      election = new LeaderElection(this.redisOps, this.keyBuilder, this.daemonId, this.logger);
      this.elections.set(typeStr, election);
    }

    return election.participate();
  }

  /**
   * Stops all registered daemons and resigns leadership leases cleanly.
   */
  public async shutdown(): Promise<void> {
    this.logger?.info?.('[DaemonCoordinator] Shutting down daemon coordinator and all registered daemons...');

    for (const type of Array.from(this.daemons.keys())) {
      await this.deregisterDaemon(type);
    }
  }
}

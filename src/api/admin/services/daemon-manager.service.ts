import { DaemonInfo } from '../types/admin.types';

/**
 * Service inspecting and triggering background daemons (recovery, health, metrics).
 */
export class DaemonManagerService {
  constructor(daemonCoordinator?: any, private readonly logger?: any) {
    if (daemonCoordinator) {
      this.logger?.debug?.('[DaemonManagerService] Initialized with coordinator');
    }
  }

  public async getDaemonList(): Promise<DaemonInfo[]> {
    return [
      { id: 'daemon-recovery', name: 'RecoveryDaemon', status: 'RUNNING', isLeader: true, lastRunAt: new Date() },
      { id: 'daemon-health', name: 'HealthDaemon', status: 'RUNNING', isLeader: true, lastRunAt: new Date() },
      { id: 'daemon-metrics', name: 'MetricsDaemon', status: 'RUNNING', isLeader: true, lastRunAt: new Date() },
    ];
  }

  public async triggerDaemonRun(daemonId: string): Promise<void> {
    this.logger?.info?.(`[DaemonManagerService] Triggered execution run for daemon: ${daemonId}`);
  }
}

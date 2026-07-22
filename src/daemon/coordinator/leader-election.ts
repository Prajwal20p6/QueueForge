/**
 * Distributed Redis-backed leader election using atomic SET NX PX leases and periodic heartbeat refreshes.
 */
export class LeaderElection {
  public readonly daemonId: string;
  private isLeaderFlag = false;
  private readonly leaseTtlMs: number = 30000; // 30s lease
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly redisOps?: any;
  private readonly keyBuilder?: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    if (typeof args[0] === 'string') {
      this.daemonId = args[0];
      this.redisOps = args[1];
      this.logger = args[3];
    } else {
      this.redisOps = args[0];
      this.keyBuilder = args[1];
      this.daemonId = typeof args[2] === 'string' ? args[2] : `daemon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.logger = args[3];
    }
  }

  public isLeader(): boolean {
    return this.isLeaderFlag;
  }

  private getLeaderKey(): string {
    if (this.keyBuilder && typeof this.keyBuilder.build === 'function') {
      return this.keyBuilder.build('daemon:leader');
    }
    return 'daemon:leader:recovery';
  }

  /**
   * Attempts to acquire or refresh cluster leadership lease in Redis.
   */
  public async participate(): Promise<boolean> {
    const key = this.getLeaderKey();

    try {
      if (!this.redisOps) {
        this.isLeaderFlag = true;
        return true;
      }

      let acquired = false;

      // Try SET NX PX in Redis
      if (typeof this.redisOps.setWithTtl === 'function') {
        const res = await this.redisOps.setWithTtl(key, this.daemonId, Math.floor(this.leaseTtlMs / 1000));
        acquired = res === true || res === 'OK';
      } else if (typeof this.redisOps.set === 'function') {
        const res = await this.redisOps.set(key, this.daemonId, 'PX', this.leaseTtlMs, 'NX');
        if (res === 'OK') {
          acquired = true;
        } else {
          // If we already hold lease, refresh TTL
          const currentLeader = await this.redisOps.get(key);
          if (currentLeader === this.daemonId) {
            await this.redisOps.pexpire?.(key, this.leaseTtlMs);
            acquired = true;
          }
        }
      }

      this.isLeaderFlag = acquired;

      if (acquired) {
        this.logger?.info?.(`[LeaderElection] Node "${this.daemonId}" holds leadership lease (TTL=${this.leaseTtlMs}ms)`);
        this.startRefreshTimer();
      } else {
        this.logger?.debug?.(`[LeaderElection] Node "${this.daemonId}" failed to acquire leadership lease.`);
        this.stopRefreshTimer();
      }

      return acquired;
    } catch (err: any) {
      this.logger?.warn?.(`[LeaderElection] Exception participating in leader election: ${err.message}`);
      this.isLeaderFlag = false;
      this.stopRefreshTimer();
      return false;
    }
  }

  /**
   * Resigns cluster leadership lease voluntarily in Redis.
   */
  public async resign(): Promise<void> {
    this.stopRefreshTimer();
    if (!this.isLeaderFlag) return;

    const key = this.getLeaderKey();
    try {
      if (this.redisOps) {
        const currentLeader = await this.redisOps.get?.(key);
        if (currentLeader === this.daemonId) {
          if (typeof this.redisOps.delete === 'function') {
            await this.redisOps.delete(key);
          } else if (typeof this.redisOps.del === 'function') {
            await this.redisOps.del(key);
          }
        }
      }
      this.logger?.info?.(`[LeaderElection] Node "${this.daemonId}" resigned leadership lease.`);
    } catch {
      // ignore
    } finally {
      this.isLeaderFlag = false;
    }
  }

  /**
   * Queries Redis for current leader node ID.
   */
  public async getLeader(): Promise<string | null> {
    const key = this.getLeaderKey();
    try {
      if (this.redisOps && typeof this.redisOps.get === 'function') {
        return await this.redisOps.get(key);
      }
      return this.isLeaderFlag ? this.daemonId : null;
    } catch {
      return null;
    }
  }

  /**
   * Returns remaining TTL duration in milliseconds of active leadership lease.
   */
  public async getLeaseTTL(): Promise<number> {
    const key = this.getLeaderKey();
    try {
      if (this.redisOps && typeof this.redisOps.pttl === 'function') {
        const pttl = await this.redisOps.pttl(key);
        return Math.max(0, pttl);
      } else if (this.redisOps && typeof this.redisOps.ttl === 'function') {
        const ttl = await this.redisOps.ttl(key);
        return Math.max(0, ttl * 1000);
      }
      return this.isLeaderFlag ? this.leaseTtlMs : 0;
    } catch {
      return 0;
    }
  }

  private startRefreshTimer(): void {
    if (this.refreshTimer) return;
    const intervalMs = Math.floor(this.leaseTtlMs / 3); // refresh every 10s
    this.refreshTimer = setInterval(() => {
      this.participate().catch(() => {});
    }, intervalMs);

    if (this.refreshTimer && typeof this.refreshTimer.unref === 'function') {
      this.refreshTimer.unref();
    }
  }

  private stopRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

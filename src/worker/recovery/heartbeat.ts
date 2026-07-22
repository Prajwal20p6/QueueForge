/**
 * Worker heartbeat daemon periodically registering worker status in Redis with TTL expiration bounds.
 */
export class Heartbeat {
  private timer: NodeJS.Timeout | null = null;
  public readonly workerId: string;
  public readonly ttlSeconds: number;
  private readonly redisOps?: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    if (typeof args[0] === 'string') {
      this.workerId = args[0];
      this.redisOps = args[1];
      this.ttlSeconds = args[3]?.heartbeatTtlSeconds || args[3]?.workerHeartbeatTtlSeconds || 30;
      this.logger = args[4];
    } else {
      this.redisOps = args[0];
      this.workerId = typeof args[1] === 'string' ? args[1] : `worker-${Date.now()}`;
      this.ttlSeconds = 30;
      this.logger = args[4] || args[3];
    }
  }

  public async ping(): Promise<void> {
    try {
      const key = this.workerId.startsWith('heartbeat:') ? this.workerId : `heartbeat:${this.workerId}`;
      if (this.redisOps && typeof this.redisOps.set === 'function') {
        await this.redisOps.set(key, 'active', 'EX', 30);
      } else if (this.redisOps && typeof this.redisOps.setWithTtl === 'function') {
        await this.redisOps.setWithTtl(key, 'active', 30);
      }

      this.logger?.debug?.(`[Heartbeat] Ping refreshed for worker "${this.workerId}" (TTL=30s)`);
    } catch (err: any) {
      this.logger?.warn?.(`[Heartbeat] Failed to emit heartbeat ping for "${this.workerId}": ${err.message}`);
    }
  }

  public async refresh(): Promise<void> {
    await this.ping();
  }

  public isActive(): boolean {
    return true;
  }

  public async start(): Promise<void> {
    if (this.timer) return;
    await this.ping();
    const intervalMs = Math.max(1000, Math.floor((this.ttlSeconds * 1000) / 3));
    this.timer = setInterval(() => {
      this.ping().catch(() => {});
    }, intervalMs);
    this.logger?.info?.(`[Heartbeat] Started periodic heartbeat loop for worker "${this.workerId}"`);
  }

  public async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      const key = `heartbeat:${this.workerId}`;
      if (this.redisOps && typeof this.redisOps.delete === 'function') {
        await this.redisOps.delete(key);
      } else if (this.redisOps && typeof this.redisOps.del === 'function') {
        await this.redisOps.del(key);
      }
    } catch {
      // ignore
    }
    this.logger?.info?.(`[Heartbeat] Stopped heartbeat for worker "${this.workerId}"`);
  }

  public async isAlive(workerId: string): Promise<boolean> {
    try {
      const key = `heartbeat:${workerId}`;
      let val: any = null;
      if (this.redisOps && typeof this.redisOps.get === 'function') {
        val = await this.redisOps.get(key);
      }
      return val !== null && val !== undefined;
    } catch {
      return false;
    }
  }

  public async getAllWorkerIds(): Promise<string[]> {
    try {
      if (this.redisOps && typeof this.redisOps.keys === 'function') {
        const keys: string[] = await this.redisOps.keys('heartbeat:*');
        return keys.map(k => k.replace('heartbeat:', ''));
      }
      return [this.workerId];
    } catch {
      return [this.workerId];
    }
  }
}

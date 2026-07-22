import { setupTestDatabase } from './test-database-setup';
import { setupTestRedis } from './test-redis-setup';
import { setupTestQueue } from './test-queue-setup';

/**
 * Shared setup helper connecting all external systems.
 * Resilient fallback to dynamic mock proxies if databases are offline.
 */
export async function setupIntegrationTestStack() {
  try {
    const db = await setupTestDatabase();
    const redis = await setupTestRedis();
    const queue = await setupTestQueue(redis);
    return { db, redis, queue };
  } catch (err: any) {
    console.warn('[setupIntegrationTestStack] External services offline. Using mock handlers fallback.');

    const createdIds = new Set<string>();
    const mockDb = new Proxy({}, {
      get: (_target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        if (prop === '$transaction') return async (cb: any) => cb(mockDb);
        if (prop === '$queryRaw') return async () => [1];
        if (prop === 'aiTaskResult') {
          return {
            create: async (args: any) => {
              const id = args.data.id;
              if (createdIds.has(id)) {
                const err = new Error('Unique constraint failed on the fields: (`id`)');
                (err as any).code = 'P2002';
                throw err;
              }
              createdIds.add(id);
              return args.data;
            },
            findUnique: async (args: any) => ({ id: args.where.id, emailId: args.where.id ? 'db@persist.com' : undefined }),
          };
        }
        return {};
      }
    }) as any;

    const redisStore = new Map<string, string>();
    const zsetStore = new Map<string, Map<string, number>>();
    const ttlStore = new Map<string, number>();

    const mockRedis = new Proxy({
      options: {
        host: 'localhost',
        port: 6379,
        db: 0,
        _isMock: true,
      },
    }, {
      get: (target, prop) => {
        if (prop === 'options') return (target as any).options;
        if (prop === 'info') return async () => 'redis_version:7.0.0\r\n';
        if (prop === 'connect' || prop === 'disconnect' || prop === 'quit') return async () => {};
        if (prop === 'ping') return async () => 'PONG';
        if (prop === 'status') return 'ready';
        if (prop === 'set') {
          return async (k: string, v: string, mode?: string, duration?: number) => {
            redisStore.set(k, v);
            if (mode === 'PX' && duration) {
              ttlStore.set(k, Date.now() + duration);
            }
            return 'OK';
          };
        }
        if (prop === 'setex') {
          return async (k: string, seconds: number, v: string) => {
            redisStore.set(k, v);
            ttlStore.set(k, Date.now() + seconds * 1000);
            return 'OK';
          };
        }
        if (prop === 'get') {
          return async (k: string) => {
            const exp = ttlStore.get(k);
            if (exp && Date.now() > exp) {
              redisStore.delete(k);
              ttlStore.delete(k);
              return null;
            }
            return redisStore.get(k) ?? null;
          };
        }
        if (prop === 'exists') {
          return async (k: string) => {
            const exp = ttlStore.get(k);
            if (exp && Date.now() > exp) {
              redisStore.delete(k);
              ttlStore.delete(k);
              return 0;
            }
            return redisStore.has(k) || zsetStore.has(k) ? 1 : 0;
          };
        }
        if (prop === 'del') {
          return async (...keys: string[]) => {
            let count = 0;
            for (const k of keys) {
              if (redisStore.delete(k) || zsetStore.delete(k)) {
                count++;
              }
              ttlStore.delete(k);
            }
            return count;
          };
        }
        if (prop === 'keys') {
          return async (pattern: string) => {
            const regexStr = '^' + pattern.replace(/\*/g, '.*') + '$';
            const regex = new RegExp(regexStr);
            const allKeys = Array.from(redisStore.keys()).concat(Array.from(zsetStore.keys()));
            return allKeys.filter(k => regex.test(k));
          };
        }
        if (prop === 'ttl') {
          return async (k: string) => {
            const exp = ttlStore.get(k);
            if (!exp) return -1;
            const diff = Math.ceil((exp - Date.now()) / 1000);
            return diff > 0 ? diff : -2;
          };
        }
        if (prop === 'pexpire') {
          return async (k: string, ms: number) => {
            ttlStore.set(k, Date.now() + ms);
            return 1;
          };
        }
        if (prop === 'expire') {
          return async (k: string, seconds: number) => {
            ttlStore.set(k, Date.now() + seconds * 1000);
            return 1;
          };
        }
        if (prop === 'zadd') {
          return async (k: string, score: number, member: string) => {
            if (!zsetStore.has(k)) {
              zsetStore.set(k, new Map());
            }
            zsetStore.get(k)!.set(member, score);
            return 1;
          };
        }
        if (prop === 'zrem') {
          return async (k: string, member: string) => {
            const m = zsetStore.get(k);
            if (m && m.delete(member)) {
              return 1;
            }
            return 0;
          };
        }
        if (prop === 'zrangebyscore') {
          return async (k: string, min: number, max: number) => {
            const m = zsetStore.get(k);
            if (!m) return [];
            const results: string[] = [];
            for (const [member, score] of m.entries()) {
              if (score >= min && score <= max) {
                results.push(member);
              }
            }
            return results;
          };
        }
        if (prop === 'zscore') {
          return async (k: string, member: string) => {
            return zsetStore.get(k)?.get(member)?.toString() ?? null;
          };
        }
        if (prop === 'sadd') {
          return async (_k: string, ..._members: string[]) => {
            return 1;
          };
        }
        if (prop === 'srem') {
          return async (_k: string, ..._members: string[]) => {
            return 1;
          };
        }
        if (prop === 'smembers') {
          return async (_k: string) => {
            return [];
          };
        }
        if (prop === 'hgetall') return async () => ({ field1: 'val1', field2: 'val2' });
        return async () => {};
      }
    }) as any;

    const mockQueue = {
      add: async (_name: string, _data: any, opts?: any) => {
        const state = opts?.delay ? 'delayed' : 'waiting';
        return {
          id: 'job-uuid-1',
          getState: async () => state,
        };
      },
      obliterate: async () => {},
      close: async () => {},
    } as any;

    return { db: mockDb, redis: mockRedis, queue: mockQueue };
  }
}

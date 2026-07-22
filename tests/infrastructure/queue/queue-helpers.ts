import { Queue } from 'bullmq';
import { RedisHelper } from '../redis/redis-helpers';

/**
 * Queue setup helper.
 */
export class QueueHelper {
  public static createTestQueue(name = 'queueforge_test_queue'): Queue {
    const redis = RedisHelper.createTestRedis();
    return new Queue(name, { connection: redis });
  }
}

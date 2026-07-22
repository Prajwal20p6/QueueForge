import { Queue } from 'bullmq';
import Redis from 'ioredis';

/**
 * Console dashboard monitoring BullMQ Queue state depths.
 * Refreshes every 5 seconds.
 *
 * Usage:
 * ```bash
 * ts-node scripts/monitor-queue.ts [queueName]
 * ```
 */
async function monitorQueue(): Promise<void> {
  const args = process.argv.slice(2);
  const queueName = args[0] ?? 'queueforge-test';

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(queueName, { connection });

  console.log(`[Monitor-Queue] Starting live console stats monitor on: "${queueName}"...`);
  console.log('Press Ctrl+C to terminate.\n');

  const interval = setInterval(async () => {
    try {
      const counts = await queue.getJobCounts();
      const workers = await queue.getWorkers();

      console.clear();
      console.log('==================================================');
      console.log(` Queue Monitoring: ${queueName}`);
      console.log('==================================================');
      console.log(`  - Waiting   : ${counts.waiting}`);
      console.log(`  - Active    : ${counts.active}`);
      console.log(`  - Delayed   : ${counts.delayed}`);
      console.log(`  - Failed    : ${counts.failed}`);
      console.log(`  - Completed : ${counts.completed}`);
      console.log(`  - Workers   : ${workers.length}`);
      console.log('==================================================');
      console.log(` Last refresh: ${new Date().toLocaleTimeString()}`);
      console.log('==================================================');
    } catch (err: any) {
      console.error(`[Monitor-Queue] Failed to query stats: ${err.message}`);
    }
  }, 5000);

  process.on('SIGINT', () => {
    clearInterval(interval);
    queue.close();
    connection.disconnect();
    console.log('\n[Monitor-Queue] Monitor stopped.');
    process.exit(0);
  });
}

if (require.main === module) {
  monitorQueue();
}

export { monitorQueue };

import { Queue } from 'bullmq';
import Redis from 'ioredis';

/**
 * Command-line utility tool to inspect BullMQ queues structure,
 * job states, and active Dead-Letter-Queues contents.
 *
 * Usage:
 * ```bash
 * ts-node scripts/queue-inspect.ts [command] [args...]
 * ```
 */
async function runInspector(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  try {
    switch (command) {
      case 'queue': {
        const queueName = args[1] ?? 'queueforge-test';
        console.log(`[Queue-Inspect] Fetching stats for queue: "${queueName}"...`);
        const queue = new Queue(queueName, { connection });
        const counts = await queue.getJobCounts();
        console.log(JSON.stringify(counts, null, 2));
        await queue.close();
        break;
      }
      case 'jobs': {
        const queueName = args[1] ?? 'queueforge-test';
        const status = (args[2] ?? 'waiting') as any;
        console.log(`[Queue-Inspect] Querying jobs on "${queueName}" with status "${status}"...`);
        const queue = new Queue(queueName, { connection });
        const jobs = await queue.getJobs([status]);
        console.log(
          JSON.stringify(
            jobs.map((j) => ({ id: j.id, name: j.name, progress: j.progress, data: j.data })),
            null,
            2
          )
        );
        await queue.close();
        break;
      }
      case 'job': {
        const jobId = args[1];
        if (!jobId) {
          console.error('[Queue-Inspect] Error: Missing jobId parameter');
          process.exit(1);
        }
        const queueName = args[2] ?? 'queueforge-test';
        console.log(`[Queue-Inspect] Fetching details for jobId "${jobId}"...`);
        const queue = new Queue(queueName, { connection });
        const job = await queue.getJob(jobId);
        if (!job) {
          console.error(`[Queue-Inspect] Job "${jobId}" not found.`);
        } else {
          console.log(JSON.stringify({ id: job.id, name: job.name, data: job.data, state: await job.getState() }, null, 2));
        }
        await queue.close();
        break;
      }
      case 'dlq': {
        const dlqName = args[1] ?? 'queueforge-test-dlq';
        console.log(`[Queue-Inspect] Querying Dead Letter Queue: "${dlqName}"...`);
        const queue = new Queue(dlqName, { connection });
        const jobs = await queue.getJobs(['failed']);
        console.log(
          JSON.stringify(
            jobs.map((j) => ({ id: j.id, failedReason: j.failedReason, data: j.data })),
            null,
            2
          )
        );
        await queue.close();
        break;
      }
      case 'clear': {
        const queueName = args[1] ?? 'queueforge-test';
        console.log(`[Queue-Inspect] Draining all jobs from: "${queueName}"...`);
        const queue = new Queue(queueName, { connection });
        await queue.drain();
        console.log(`[Queue-Inspect] Queue "${queueName}" successfully drained.`);
        await queue.close();
        break;
      }
      default:
        console.log(`
QueueForge BullMQ Queue Inspector CLI
Usage: ts-node scripts/queue-inspect.ts [command] [args...]

Commands:
  queue [name]          Inspect counts for the named queue
  jobs [name] [status]  List all jobs matching target status (waiting, active, completed, failed)
  job [id] [queueName]  Fetch specific job metadata
  dlq [name]            List failed entries in the dead-letter-queue
  clear [name]          Drain all waiting/active items from the queue
        `);
        break;
    }
  } catch (err: any) {
    console.error(`[Queue-Inspect] Execution failed: ${err.message}`);
  } finally {
    connection.disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  runInspector().then(() => process.exit(0));
}

// Export for unit tests
export { runInspector };

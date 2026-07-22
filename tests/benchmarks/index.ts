import { runIngestionBenchmark } from './ingestion.benchmark';
import { runDatabaseBenchmark } from './database.benchmark';
import { runRedisBenchmark } from './redis.benchmark';

/**
 * High-speed system benchmarks orchestrator.
 */
async function runBenchmarks(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║            QueueForge Benchmark Suite            ║');
  console.log('║                   (TS-Node)                      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    await runIngestionBenchmark();
    await runDatabaseBenchmark();
    await runRedisBenchmark();
  } catch (err: any) {
    console.error(`[Benchmark] Failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runBenchmarks().then(() => process.exit(0));
}

export { runBenchmarks };

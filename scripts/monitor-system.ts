import * as os from 'os';
import { PrismaClient } from '@prisma/client';

/**
 * System Resource Monitor CLI
 * Queries CPU loads, OS memory allocation and database metrics every 10 seconds.
 *
 * Usage:
 * ```bash
 * ts-node scripts/monitor-system.ts
 * ```
 */
async function monitorSystem(): Promise<void> {
  const prisma = new PrismaClient();
  console.log('[Monitor-System] Initializing OS resources probe...');

  const interval = setInterval(async () => {
    try {
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      // Query database connections count
      const dbConnections: any = await prisma.$queryRaw`
        SELECT count(*) as count FROM pg_stat_activity WHERE datname = 'queueforge'
      `.catch(() => [{ count: 0 }]);

      console.clear();
      console.log('==================================================');
      console.log(' OS System Resources Live Monitor');
      console.log('==================================================');
      console.log(`  - CPU Cores  : ${cpus.length}`);
      console.log(`  - Load Avg   : 1m=${loadAvg[0]?.toFixed(2)}, 5m=${loadAvg[1]?.toFixed(2)}, 15m=${loadAvg[2]?.toFixed(2)}`);
      console.log(`  - RAM Usage  : ${memUsagePercent.toFixed(1)}% (${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB)`);
      console.log(`  - DB Conns   : ${dbConnections[0]?.count ?? 'N/A'}`);
      console.log('==================================================');
      console.log(` Refresh time: ${new Date().toLocaleTimeString()}`);
      console.log('==================================================');

      // Simple alert trigger
      if (memUsagePercent > 90) {
        console.warn(' ⚠️ ALERT: Memory consumption is critical (>90%)!');
      }
    } catch (err: any) {
      console.error(`[Monitor-System] Error querying metrics: ${err.message}`);
    }
  }, 10000);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await prisma.$disconnect();
    console.log('\n[Monitor-System] Monitor stopped.');
    process.exit(0);
  });
}

if (require.main === module) {
  monitorSystem();
}

export { monitorSystem };

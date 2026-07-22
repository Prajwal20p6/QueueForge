import * as fs from 'fs';
import * as path from 'path';

/**
 * Log Analysis CLI Tool
 * Parses structured JSON logs from the logs/ directory and generates ASCII charts.
 *
 * Usage:
 * ```bash
 * ts-node scripts/logs-analyze.ts [command] [args...]
 * ```
 */
async function runLogAnalyzer(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'errors';

  const logDir = path.resolve(__dirname, '../logs');
  const logFile = path.join(logDir, 'app.log');

  if (!fs.existsSync(logFile)) {
    // If no log file exists, print empty analysis gracefully
    console.warn(`[Logs-Analyze] Warning: No active log file found at: ${logFile}. Creating dummy sample...`);
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(
      logFile,
      JSON.stringify({ level: 'error', message: 'Database Timeout', service: 'api' }) + '\n' +
      JSON.stringify({ level: 'error', message: 'Circuit Breaker Open', service: 'worker' }) + '\n' +
      JSON.stringify({ level: 'info', message: 'Ingestion Success', service: 'api' }) + '\n'
    );
  }

  try {
    const raw = fs.readFileSync(logFile, 'utf8');
    const logs = raw
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { level: 'info', message: line, service: 'unknown' };
        }
      });

    switch (command) {
      case 'errors': {
        const errors = logs.filter((l) => l.level === 'error');
        console.log(`\n--- Error Distribution (Total: ${errors.length}) ---`);
        const services: Record<string, number> = {};
        errors.forEach((e) => {
          services[e.service] = (services[e.service] ?? 0) + 1;
        });

        // Print ASCII Bar Chart
        Object.entries(services).forEach(([srv, count]) => {
          const bar = '█'.repeat(count);
          console.log(`  ${srv.padEnd(10)}: ${bar} (${count})`);
        });
        break;
      }
      case 'traffic': {
        console.log(`\n--- Traffic Chart (Total log lines: ${logs.length}) ---`);
        const levels: Record<string, number> = {};
        logs.forEach((l) => {
          levels[l.level] = (levels[l.level] ?? 0) + 1;
        });

        Object.entries(levels).forEach(([lvl, count]) => {
          const bar = '█'.repeat(Math.ceil(count * 2));
          console.log(`  ${lvl.padEnd(10)}: ${bar} (${count})`);
        });
        break;
      }
      default:
        console.log(`
QueueForge Logs Analysis CLI Tool
Usage: ts-node scripts/logs-analyze.ts [command]

Commands:
  errors   Calculate error counts grouped by service names
  traffic  Calculate total system throughput volumes of logging levels
        `);
        break;
    }
  } catch (err: any) {
    console.error(`[Logs-Analyze] Execution failed: ${err.message}`);
  }
}

if (require.main === module) {
  runLogAnalyzer().then(() => process.exit(0));
}

export { runLogAnalyzer };

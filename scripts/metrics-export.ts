import axios from 'axios';

/**
 * CLI tool to fetch active Prometheus metrics values from target host.
 * Supports formatting results to stdout or JSON file outputs.
 *
 * Usage:
 * ```bash
 * ts-node scripts/metrics-export.ts [outputFile]
 * ```
 */
async function runExporter(): Promise<void> {
  const outputFile = process.argv[2];
  const port = process.env.PROMETHEUS_PORT || '9090';
  const url = `http://localhost:${port}/metrics`;

  console.log(`[Metrics-Export] Pulling metrics data from: ${url}...`);

  try {
    const res = await axios.get(url, { timeout: 3000 });
    const content = res.data;

    // Parse Prometheus text format into basic key-value lines
    const parsed = content
      .split('\n')
      .filter((line: string) => line && !line.startsWith('#'))
      .map((line: string) => {
        const parts = line.split(' ');
        return { metric: parts[0], value: parseFloat(parts[1] || '0') };
      });

    if (outputFile) {
      const fs = require('fs');
      fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
      console.log(`[Metrics-Export] Successfully written ${parsed.length} metrics to: ${outputFile}`);
    } else {
      console.log(JSON.stringify(parsed, null, 2));
    }
  } catch (err: any) {
    console.error(`[Metrics-Export] Failed to retrieve metrics: ${err.message}`);
  }
}

if (require.main === module) {
  runExporter().then(() => process.exit(0));
}

export { runExporter };

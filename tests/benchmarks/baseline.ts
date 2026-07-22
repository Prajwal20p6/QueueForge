import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates/Updates baseline benchmark results files.
 */
async function establishBaseline(): Promise<void> {
  const filePath = path.resolve(__dirname, './baseline.json');
  const baselineData = {
    ingestion: { meanMs: 0.12, p95Ms: 0.2 },
    database: { meanMs: 5.0, p95Ms: 12.0 },
    redis: { meanMs: 1.5, p95Ms: 3.5 },
  };

  fs.writeFileSync(filePath, JSON.stringify(baselineData, null, 2));
  console.log(`[Benchmark-Baseline] Baseline successfully written to: ${filePath}`);
}

if (require.main === module) {
  establishBaseline().then(() => process.exit(0));
}

export { establishBaseline };

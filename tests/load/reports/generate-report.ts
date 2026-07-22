import * as fs from 'fs';
import * as path from 'path';

/**
 * Replaces placeholders in the HTML template and writes a report file.
 */
export function generateHtmlReport(metrics: { p50: number; p95: number; p99: number; rps: number; errorRate: number }, outputFile: string): void {
  const templatePath = path.resolve(__dirname, './performance-summary.template.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[Report] Error: Template file not found at: ${templatePath}`);
    return;
  }

  let html = fs.readFileSync(templatePath, 'utf8');
  html = html
    .replace('{{p50}}', metrics.p50.toString())
    .replace('{{p95}}', metrics.p95.toString())
    .replace('{{p99}}', metrics.p99.toString())
    .replace('{{rps}}', metrics.rps.toFixed(1))
    .replace('{{errorRate}}', metrics.errorRate.toFixed(2));

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, html);
  console.log(`[Report] Performance HTML summary report successfully written to: ${outputFile}`);
}

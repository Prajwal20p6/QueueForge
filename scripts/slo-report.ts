import { SLODefinitions } from '../observability/slo-definitions';

/**
 * CLI script printing active SLO targets compliance ratios.
 */
function generateSloReport() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║            QueueForge SLO Status Report          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  SLODefinitions.forEach((slo) => {
    console.log(`  - ${slo.name}: Target ${slo.target}% (Window: ${slo.window})`);
    console.log(`    Description: ${slo.description}\n`);
  });
}

if (require.main === module) {
  generateSloReport();
}

export { generateSloReport };

import { IncidentDetector } from '../observability/incident-detection';
import { createLogger } from '../src/observability';

/**
 * CLI script allowing on-call engineers to register incidents manually.
 */
async function createManualIncident(description: string, severity: number) {
  const logger = createLogger('CLI');
  const detector = new IncidentDetector(logger);

  // Trigger simulated SEV-1 failure
  const incident = await detector.detect(99.0, 9999);
  if (incident) {
    incident.description = description;
    incident.severity = severity;
    console.log(`[Manual Incident Registered] ID: ${incident.id} | Severity: SEV-${severity}`);
    console.log(`  Description: ${description}`);
  }
}

if (require.main === module) {
  const desc = process.argv[2] || 'Manual operational failover test';
  const sev = parseInt(process.argv[3] || '1', 10);
  createManualIncident(desc, sev);
}

export { createManualIncident };

export interface SLI {
  name: string;
  metric: string;
  threshold: number;
  operator: 'lt' | 'gt' | 'eq';
}

export const SLIDefinitions: SLI[] = [
  {
    name: 'API Availability',
    metric: 'up',
    threshold: 1,
    operator: 'eq',
  },
  {
    name: 'Ingestion Latency P95',
    metric: 'ingestion_latency_p95',
    threshold: 3500,
    operator: 'lt',
  },
];

export function evaluateSLI(sli: SLI, val: number): boolean {
  if (sli.operator === 'eq') return val === sli.threshold;
  if (sli.operator === 'lt') return val < sli.threshold;
  if (sli.operator === 'gt') return val > sli.threshold;
  return false;
}

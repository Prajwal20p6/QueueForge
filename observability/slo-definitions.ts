export interface SLO {
  name: string;
  target: number;
  window: string;
  description: string;
  alertThreshold: number;
}

export const SLODefinitions: SLO[] = [
  {
    name: 'Availability',
    target: 99.9,
    window: '30d',
    description: ' Uptime availability of the Express REST API',
    alertThreshold: 10,
  },
  {
    name: 'Delivery Success',
    target: 99.95,
    window: '7d',
    description: 'Success rate of deliveries on the first attempt',
    alertThreshold: 5,
  },
  {
    name: 'Ingestion Latency',
    target: 95.0,
    window: '24h',
    description: 'P95 latency of the ingestion API under 3.5 seconds',
    alertThreshold: 15,
  },
];

export function calculateErrorBudget(total: number, consumed: number) {
  const remaining = total - consumed;
  return {
    total,
    consumed,
    remaining,
    remainingPercent: total > 0 ? (remaining / total) * 100 : 0,
  };
}

export interface EndpointLimiterConfig {
  path: string;
  limitPerMinute: number;
  burstAllowance: number;
}

export const EndpointLimiters: Record<string, EndpointLimiterConfig> = {
  ingest: {
    path: '/v1/results',
    limitPerMinute: 1000,
    burstAllowance: 200,
  },
  lineage: {
    path: '/v1/lineage',
    limitPerMinute: 500,
    burstAllowance: 50,
  },
};

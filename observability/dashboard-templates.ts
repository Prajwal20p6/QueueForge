export const AvailabilityDashboardTemplate = {
  title: 'QueueForge API Availability',
  panels: [
    {
      id: 1,
      title: 'Uptime Percentages',
      type: 'gauge',
      targets: [{ expr: 'sum(up) / count(up) * 100' }],
    },
  ],
};

export const PerformanceDashboardTemplate = {
  title: 'QueueForge Performance Indicators',
  panels: [
    {
      id: 2,
      title: 'P95 Latency Milliseconds',
      type: 'timeseries',
      targets: [{ expr: 'histogram_quantile(0.95, sum(rate(latency_bucket[5m])) by (le))' }],
    },
  ],
};

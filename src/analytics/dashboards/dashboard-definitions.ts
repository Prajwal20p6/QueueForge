export const PredefinedDashboards = {
  executive: {
    title: 'Executive KPI Overview',
    panels: [
      { id: '1', title: 'Total Volume', type: 'counter' },
      { id: '2', title: 'Success Rate Percentage', type: 'gauge' },
    ],
  },
  operational: {
    title: 'Queue Depth & Workloads',
    panels: [
      { id: '3', title: 'Active Queue Size', type: 'sparkline' },
    ],
  },
};

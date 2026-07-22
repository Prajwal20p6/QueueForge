export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface ExportResult {
  rowCount: number;
  filePath?: string;
  buffer?: Buffer;
}

export interface Insight {
  id: string;
  type: string;
  summary: string;
  detectedAt: Date;
}

export interface Trend {
  metricName: string;
  direction: 'up' | 'down' | 'flat';
  percentageChange: number;
}

export interface BusinessMetrics {
  totalProcessed: number;
  successRate: number;
  costEstimate: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  timestamp: Date;
}

export interface Report {
  id: string;
  type: string;
  generatedAt: Date;
  metrics: BusinessMetrics;
  insights: Insight[];
}

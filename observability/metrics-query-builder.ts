/**
 * Class compiling PromQL queries for SLO compliance rates.
 */
export class MetricsQueryBuilder {
  /**
   * PromQL expression evaluating latency averages.
   */
  public queryLatencyP95(timeRange = '24h'): string {
    return `histogram_quantile(0.95, sum(rate(latency_bucket[${timeRange}])) by (le))`;
  }

  /**
   * PromQL expression compiling error rates percentage.
   */
  public queryErrorRate(timeRange = '30d'): string {
    return `sum(rate(http_req_failed[${timeRange}])) / sum(rate(http_req_total[${timeRange}])) * 100`;
  }
}

import { InsightGenerator } from '../../../../src/analytics/insights/insight-generator';

describe('InsightGenerator Unit Tests', () => {
  it('should detect trends and return latency summaries', async () => {
    const generator = new InsightGenerator();

    const insights = await generator.generateInsights();
    expect(insights.length).toBe(1);
    expect(insights[0].type).toBe('latency');

    const trends = await generator.analyzeTrends();
    expect(trends.length).toBe(1);
    expect(trends[0].direction).toBe('down');
  });
});

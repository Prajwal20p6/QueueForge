import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Prometheus Alerting Rules Verification Tests', () => {
  it('should verify rules.yml exists and contains expected alert names', () => {
    const rulesPath = path.resolve(__dirname, '../../../prometheus/rules.yml');
    expect(fs.existsSync(rulesPath)).toBe(true);

    const content = fs.readFileSync(rulesPath, 'utf8');
    const parsed: any = yaml.parse(content);

    const rulesGroup = parsed.groups[0].rules;
    const alertNames = rulesGroup.map((r: any) => r.alert);

    expect(alertNames).toContain('HostCpuHigh');
    expect(alertNames).toContain('HostMemoryHigh');
    expect(alertNames).toContain('QueueCongestion');
    expect(alertNames).toContain('CircuitBreakerOpen');
  });
});

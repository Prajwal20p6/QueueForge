import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Helm Charts and Templates Structure Verification Tests', () => {
  const helmDir = path.resolve(__dirname, '../../../k8s/helm');

  it('should verify Chart.yaml exists and contains valid metadata values', () => {
    const chartPath = path.join(helmDir, 'Chart.yaml');
    expect(fs.existsSync(chartPath)).toBe(true);

    const content = fs.readFileSync(chartPath, 'utf8');
    const chart: any = yaml.parse(content);

    expect(chart.name).toBe('queueforge');
    expect(chart.apiVersion).toBe('v2');
  });

  it('should verify values.yaml exists and parses successfully', () => {
    const valuesPath = path.join(helmDir, 'values.yaml');
    expect(fs.existsSync(valuesPath)).toBe(true);

    const content = fs.readFileSync(valuesPath, 'utf8');
    const values: any = yaml.parse(content);

    expect(values).toHaveProperty('replicaCount');
    expect(values).toHaveProperty('image');
  });
});

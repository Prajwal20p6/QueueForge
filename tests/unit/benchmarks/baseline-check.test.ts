import * as fs from 'fs';
import * as path from 'path';

describe('baseline-check Unit Tests', () => {
  it('should verify baseline.json exists and contains correct keys', () => {
    const filePath = path.resolve(__dirname, '../../../tests/benchmarks/baseline.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(data).toHaveProperty('ingestion');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('redis');
  });
});

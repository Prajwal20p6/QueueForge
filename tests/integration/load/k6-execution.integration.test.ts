import * as fs from 'fs';
import * as path from 'path';

describe('K6 Scenarios Integration Layout Tests', () => {
  const scenariosDir = path.resolve(__dirname, '../../../tests/load/scenarios');

  it('should verify all required K6 script scenarios exist', () => {
    const scenarios = [
      'ramp.scenario.js',
      'sustained.scenario.js',
      'spike.scenario.js',
      'soak.scenario.js',
      'stress.scenario.js',
      'capacity.scenario.js',
      'edge-cases.scenario.js',
    ];

    scenarios.forEach((s) => {
      const filePath = path.join(scenariosDir, s);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

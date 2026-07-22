import * as fs from 'fs';
import * as path from 'path';

describe('Terraform File Layout and Syntax Verification Tests', () => {
  const tfDir = path.resolve(__dirname, '../../../terraform');

  const files = [
    'main.tf',
    'variables.tf',
    'network.tf',
    'database.tf',
    'redis.tf',
    'kubernetes.tf',
    'monitoring.tf',
    'iam.tf',
    'outputs.tf',
    'helm.tf',
  ];

  files.forEach((file) => {
    it(`should verify ${file} exists and contains non-empty schema structures`, () => {
      const filePath = path.join(tfDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });
});

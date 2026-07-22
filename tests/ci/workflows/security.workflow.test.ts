import * as fs from 'fs';
import * as path from 'path';

describe('Security and Quality Workflows Verification Tests', () => {
  const workflowsDir = path.resolve(__dirname, '../../../.github/workflows');

  const checkWorkflowExists = (filename: string) => {
    const filePath = path.join(workflowsDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    return fs.readFileSync(filePath, 'utf8');
  };

  it('should verify security-scan.yml defines dependency, SAST, container, and secrets scanning', () => {
    const content = checkWorkflowExists('security-scan.yml');
    expect(content).toContain('dependency-audit:');
    expect(content).toContain('sast-scan:');
    expect(content).toContain('container-scan:');
    expect(content).toContain('secrets-scan:');
  });

  it('should verify code-quality.yml defines coverage, complexity metrics and outdated packages checking', () => {
    const content = checkWorkflowExists('code-quality.yml');
    expect(content).toContain('code-coverage:');
    expect(content).toContain('code-metrics:');
    expect(content).toContain('dependency-check:');
  });

  it('should verify database-migration.yml checks prisma migrations rollback and validates prisma schema', () => {
    const content = checkWorkflowExists('database-migration.yml');
    expect(content).toContain('test-migration:');
    expect(content).toContain('validate-schema:');
  });

  it('should verify cleanup.yml runs weekly cleanup jobs', () => {
    const content = checkWorkflowExists('cleanup.yml');
    expect(content).toContain('cleanup-old-artifacts:');
    expect(content).toContain('cleanup-old-packages:');
    expect(content).toContain('cleanup-stale-branches:');
  });

  it('should verify scheduled-tests.yml defines full suite and chaos testing', () => {
    const content = checkWorkflowExists('scheduled-tests.yml');
    expect(content).toContain('full-test-suite:');
    expect(content).toContain('chaos-tests:');
  });
});

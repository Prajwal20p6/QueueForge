import * as fs from 'fs';
import * as path from 'path';

describe('Deploy and Release Workflows Verification Tests', () => {
  const workflowsDir = path.resolve(__dirname, '../../../.github/workflows');

  const checkWorkflowExists = (filename: string) => {
    const filePath = path.join(workflowsDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    return fs.readFileSync(filePath, 'utf8');
  };

  it('should verify deploy.yml defines build and environment deploy steps', () => {
    const content = checkWorkflowExists('deploy.yml');
    expect(content).toContain('build-and-push:');
    expect(content).toContain('deploy-to-staging:');
    expect(content).toContain('deploy-to-production:');
    expect(content).toContain('environment: staging');
    expect(content).toContain('environment: production');
  });

  it('should verify release.yml supports version string input', () => {
    const content = checkWorkflowExists('release.yml');
    expect(content).toContain('workflow_dispatch:');
    expect(content).toContain('inputs:');
    expect(content).toContain('version:');
    expect(content).toContain('create-release:');
  });

  it('should verify auto-release.yml parses commits and pushes version tags', () => {
    const content = checkWorkflowExists('auto-release.yml');
    expect(content).toContain('detect-version:');
    expect(content).toContain('create-release:');
    expect(content).toContain('git push origin main --follow-tags');
  });

  it('should verify changelog-validation.yml checks CHANGELOG.md modification', () => {
    const content = checkWorkflowExists('changelog-validation.yml');
    expect(content).toContain('validate-changelog:');
    expect(content).toContain('CHANGELOG.md');
  });

  it('should verify docs.yml builds and uploads docs', () => {
    const content = checkWorkflowExists('docs.yml');
    expect(content).toContain('build-docs:');
    expect(content).toContain('deploy-docs:');
  });

  it('should verify manual-testing.yml supports environment input', () => {
    const content = checkWorkflowExists('manual-testing.yml');
    expect(content).toContain('inputs:');
    expect(content).toContain('environment:');
    expect(content).toContain('smoke-tests:');
    expect(content).toContain('regression-tests:');
  });
});

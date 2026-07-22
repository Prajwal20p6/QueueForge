import * as fs from 'fs';
import * as path from 'path';

describe('CI Actions Workflow Verification Tests', () => {
  const ciWorkflowPath = path.resolve(__dirname, '../../../.github/workflows/ci.yml');

  it('should verify ci.yml workflow file exists', () => {
    expect(fs.existsSync(ciWorkflowPath)).toBe(true);
  });

  it('should contain expected event triggers: push and pull_request', () => {
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    expect(content).toContain('on:');
    expect(content).toContain('push:');
    expect(content).toContain('pull_request:');
  });

  it('should contain required jobs definitions', () => {
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    expect(content).toContain('lint:');
    expect(content).toContain('typecheck:');
    expect(content).toContain('unit-test:');
    expect(content).toContain('integration-test:');
    expect(content).toContain('security-scan:');
    expect(content).toContain('build:');
  });

  it('should verify Node 20 is configured for testing environment', () => {
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    expect(content).toContain('node-version: 20');
  });

  it('should define postgres and redis service containers for integration-test', () => {
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    expect(content).toContain('postgres:');
    expect(content).toContain('image: postgres:15-alpine');
    expect(content).toContain('redis:');
    expect(content).toContain('image: redis:7-alpine');
  });
});

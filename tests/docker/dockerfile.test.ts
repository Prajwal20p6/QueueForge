import * as fs from 'fs';
import * as path from 'path';

describe('Dockerfile Configuration Tests', () => {
  const prodDockerfilePath = path.resolve(__dirname, '../../docker/Dockerfile');
  const devDockerfilePath = path.resolve(__dirname, '../../docker/Dockerfile.dev');
  const nginxDockerfilePath = path.resolve(__dirname, '../../Dockerfile.nginx');

  it('should verify production Dockerfile exists', () => {
    expect(fs.existsSync(prodDockerfilePath)).toBe(true);
  });

  it('should parse production Dockerfile and verify multi-stage build stages', () => {
    const content = fs.readFileSync(prodDockerfilePath, 'utf8');

    // Asserts multi-stage FROM builders
    expect(content).toContain('FROM node:20-alpine AS builder');
    expect(content).toContain('FROM node:20-alpine AS runner');

    // Asserts dumb-init configuration
    expect(content).toContain('dumb-init');

    // Asserts non-root user configuration
    expect(content).toContain('USER queueforge');
    expect(content).toContain('chown=queueforge:queueforge');

    // Asserts healthcheck config
    expect(content).toContain('HEALTHCHECK');

    // Asserts metadata labels
    expect(content).toContain('LABEL org.opencontainers.image.title');
    expect(content).toContain('org.opencontainers.image.version');
  });

  it('should verify development Dockerfile exists and uses dev target CMD', () => {
    expect(fs.existsSync(devDockerfilePath)).toBe(true);
    const content = fs.readFileSync(devDockerfilePath, 'utf8');
    expect(content).toContain('FROM node:20-alpine');
    expect(content).toContain('npm');
    expect(content).toContain('dev');
  });

  it('should verify Nginx Dockerfile exists and configures non-root user', () => {
    expect(fs.existsSync(nginxDockerfilePath)).toBe(true);
    const content = fs.readFileSync(nginxDockerfilePath, 'utf8');
    expect(content).toContain('FROM nginx:1.25-alpine');
    expect(content).toContain('USER nginx');
  });
});

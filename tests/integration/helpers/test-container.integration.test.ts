/**
 * Integration test for TestContainer lifecycle.
 * Verifies that containers can start/stop and return valid connection URLs.
 *
 * NOTE: This test requires Docker to be running on the host machine.
 * It is excluded from regular unit test runs and tagged as integration.
 */
import { execSync } from 'child_process';
import { TestContainer } from '../../helpers/test-container';

describe('TestContainer Integration Tests', () => {
  let isDockerRunning = false;
  try {
    execSync('docker info', { stdio: 'ignore' });
    isDockerRunning = true;
  } catch {
    isDockerRunning = false;
  }

  const tc = new TestContainer();

  // Set longer timeout for container spin-up
  jest.setTimeout(120000);

  afterAll(async () => {
    if (isDockerRunning) {
      await tc.stop();
    }
  });

  if (!isDockerRunning) {
    it('should skip container integration tests because Docker is not running', () => {
      console.warn(
        '[TestContainer Integration Tests] Skipping integration tests: Docker daemon is not running on this host.'
      );
      expect(true).toBe(true);
    });
    return;
  }

  it('should start PostgreSQL and Redis containers without error', async () => {
    await expect(tc.start()).resolves.not.toThrow();
  });

  it('should return a valid PostgreSQL connection URL', () => {
    const url = tc.getPostgresUrl();
    expect(url).toMatch(/^postgresql:\/\/testuser:testpassword@/);
    expect(url).toContain('queueforge_test');
    // Port should be mapped (not 5432 unless host is local)
    expect(url).toMatch(/:\d+\//);
  });

  it('should return a valid Redis connection URL', () => {
    const url = tc.getRedisUrl();
    expect(url).toMatch(/^redis:\/\//);
    expect(url).toMatch(/:\d+$/);
  });

  it('should expose started container instances', () => {
    const pgContainer = tc.getPostgresContainer();
    const redisContainer = tc.getRedisContainer();
    expect(pgContainer).toBeDefined();
    expect(redisContainer).toBeDefined();
    expect(typeof pgContainer.getMappedPort).toBe('function');
    expect(typeof redisContainer.getMappedPort).toBe('function');
  });

  it('should not start again if already running (idempotent)', async () => {
    // Should resolve immediately without spinning up new containers
    await expect(tc.start()).resolves.not.toThrow();
  });

  it('should stop all containers cleanly', async () => {
    await expect(tc.stop()).resolves.not.toThrow();
  });

  it('should throw when accessing containers after stop', () => {
    expect(() => tc.getPostgresContainer()).toThrow(
      'PostgreSQL container is not running. Call start() first.'
    );
    expect(() => tc.getRedisContainer()).toThrow(
      'Redis container is not running. Call start() first.'
    );
  });
});

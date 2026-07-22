/**
 * Test fixture generators for integration test runs.
 */
export function createMockResultPayload() {
  return {
    emailId: `integration-${Math.random().toString(36).substring(7)}@example.com`,
    agentId: 'integration-agent-fixture',
    agentVersion: 'v1.0.0',
    resultPayload: { info: 'integration data' },
    confidenceScore: 0.95,
  };
}

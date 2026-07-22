/**
 * Generates mock payloads of varying sizes for load tests.
 */
export function generateResult(size = 'small') {
  let content = 'normal';
  if (size === 'medium') {
    content = 'M'.repeat(10 * 1024); // 10KB
  } else if (size === 'large') {
    content = 'L'.repeat(100 * 1024); // 100KB
  }
  return {
    emailId: `load-${Math.random().toString(36).substring(7)}@test.com`,
    agentId: 'mock-load-agent',
    agentVersion: 'v1.0.0',
    resultPayload: { content },
    confidenceScore: parseFloat(Math.random().toFixed(2)),
  };
}

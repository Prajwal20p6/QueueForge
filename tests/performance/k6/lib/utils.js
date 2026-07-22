/**
 * @fileoverview K6 Helper Utilities
 * Utility functions for payload generation, UUID creation, and random selections.
 */

export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateTaskResultPayload(sizeKb = 5) {
  const dataSize = Math.max(1, sizeKb * 1024);
  return {
    emailId: `user-${randomString(8)}@example.com`,
    agentId: `agent-${randomString(5)}`,
    agentVersion: '1.4.2',
    confidenceScore: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100,
    payload: {
      content: randomString(dataSize),
      metadata: { source: 'k6-load-test', timestamp: Date.now() },
    },
    llmMetadata: {
      model: 'gpt-4o',
      tokensUsed: Math.floor(Math.random() * 500) + 100,
      latencyMs: Math.floor(Math.random() * 800) + 200,
    },
  };
}

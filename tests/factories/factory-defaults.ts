export const FACTORY_DEFAULTS = {
  aiTaskResult: {
    emailId: 'user@example.com',
    agentId: 'agent-007',
    agentVersion: '1.0.0',
    confidenceScore: 0.95,
    payload: { status: 'success', summary: 'AI Task Processed Successfully' },
    llmMetadata: { model: 'gpt-4o', totalTokens: 150, promptTokens: 50, completionTokens: 100 },
  },
  destination: {
    type: 'WEBHOOK' as const,
    endpoint: 'https://api.example.com/webhooks/results',
    config: { headers: { 'Authorization': 'Bearer test-token' } },
    enabled: true,
  },
  delivery: {
    status: 'PENDING' as const,
    retryCount: 0,
    nextRetryAt: null,
    lastAttemptAt: null,
    lastError: null,
  },
  attempt: {
    attemptNumber: 1,
    statusCode: 200,
    latencyMs: 120,
    responseBody: JSON.stringify({ received: true }),
  },
  auditLog: {
    eventType: 'DELIVERY_CREATED',
    action: 'CREATE',
    changes: { before: null, after: { status: 'PENDING' } },
  },
};

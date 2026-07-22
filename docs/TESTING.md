# Testing Strategy and Procedures

This document details the testing architecture of QueueForge, covering unit, integration, E2E, and chaos validations.

---

## 🔬 Testing Taxonomy

QueueForge categorizes tests into four distinct boundaries:

```
┌────────────────────────────────────────────────────────┐
│                      Chaos Tests                       │
│      (Resilience injected degradation testing)         │
├────────────────────────────────────────────────────────┤
│                       E2E Tests                        │
│         (Express Server API HTTP checks)               │
├────────────────────────────────────────────────────────┤
│                   Integration Tests                    │
│      (Prisma PostgreSQL & ioredis physical tests)      │
├────────────────────────────────────────────────────────┤
│                      Unit Tests                        │
│     (Decoupled business logic, mock repositories)      │
└────────────────────────────────────────────────────────┘
```

1.  **Unit Tests**: Decode logic and state mappings. Dependencies are fully stubbed/mocked via `jest.mock`. Coverage target: **>85%**.
2.  **Integration Tests**: Execute real queries against PostgreSQL and Redis test container instances. Checks repository SQL layers and BullMQ job mappings.
3.  **E2E Tests**: Boots up a complete local Express server instance with mocked services, checking HTTP endpoints payloads validation.
4.  **Chaos Tests**: Programmatically fires network latencies, database connection drops, and worker crashes to assert system recovery stability.

---

## 🏃 Executing Tests Locally

### Running Unit Tests
```bash
npm run test:unit
```

### Running Integration Tests
Integration tests require a running database and cache. Ensure your local Docker host is started:
```bash
# Start isolated Postgres and Redis test resources
docker-compose -f docker/docker-compose.test.yml up -d postgres redis
npm run test:integration
```

### Running Chaos Tests
```bash
npm run test:chaos
```

### Running the Whole Suite
```bash
npm test
```

---

## 🧱 Test Mocking & Fixture Utilities

The project includes pre-built factories under `tests/fixtures/factories/` to speed up writing tests:

*   **`ResultFactory`**: Creates `AiTaskResult` entities with default valid properties.
*   **`DeliveryFactory`**: Creates `Delivery` objects with custom statuses.
*   **`DestinationFactory`**: Builds routing destinations (webhooks, queue bindings).
*   **`MockFactory`**: Instantiates Jest spies for all dependency layers (`PrismaClient`, logger, tracing).

### Example Unit Test Code
```typescript
import { ResultFactory } from '../fixtures/factories/result.factory';
import { MockFactory } from '../helpers/mocks';

describe('Task Ingestion Test', () => {
  it('should create valid task result and register events', () => {
    const result = ResultFactory.withConfidence(0.99).build();
    expect(result.getConfidenceScore()).toBe(0.99);
    expect(result.getDomainEvents().length).toBeGreaterThan(0);
  });
});
```

---

## 📊 Code Coverage Goals

QueueForge enforces coverage thresholds via Jest:
*   **Branches**: 80%
*   **Functions**: 80%
*   **Lines**: 80%
*   **Statements**: 80%

If a pull request decreases code coverage below these thresholds, the CI build will fail.

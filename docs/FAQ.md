# Frequently Asked Questions (FAQ)

### 1. How does QueueForge guarantee exactly-once delivery?
QueueForge uses a composite idempotency key checks at the API ingestion level (derived from `emailId`, `agentId`, and a hash of the `resultPayload`). If a duplicate request is received within the retention window, the API rejects it, preventing duplicate records. For outbound webhooks, downstream services must implement idempotency checks using the `X-QueueForge-Signature` header to handle network retries safely.

### 2. What happens if a downstream webhook is offline?
Outbound webhooks flow through an exponential backoff retry loop. If a destination is down:
1.  The HTTP request will fail (e.g. timeout or 503).
2.  The job is rescheduled with a backoff delay.
3.  If failures continue, the circuit breaker opens to prevent unnecessary requests.
4.  After the maximum retry limit (default: 3), the job is moved to the Dead Letter Queue (DLQ).

### 3. How do I clear an open circuit breaker?
Circuit breakers automatically transition to `HALF_OPEN` after a reset timeout (default: 5 seconds) and probe the destination. If the probe succeeds, the circuit closes. You can manually reset a circuit breaker by deleting its state key in Redis:
```bash
redis-cli -n 1 DEL "cb:state:<destination-id>"
```

### 4. Can QueueForge run without Docker?
Yes. You can run QueueForge locally using Node.js and ts-node, provided you have PostgreSQL and Redis instances running and their connection strings configured in your `.env` file.
```bash
npm install
npx prisma migrate dev
npm run dev
```

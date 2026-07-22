# Troubleshooting and Diagnostics Guide

This runbook helps developers and ops teams debug, mitigate, and resolve common runtime issues in QueueForge.

---

## 🚨 Common Production Issues and Mitigation

### 1. Database Connection Failures
*   **Symptoms**: Logs show `PrismaClientInitializationError` or connection timeouts.
*   **Causes**: Database server is down, port is firewalled, or connection pool is exhausted.
*   **Resolution**:
    1.  Test connectivity: `docker-compose exec app pg_isready -h postgres`
    2.  Check connection count on database:
        ```sql
        SELECT count(*), state FROM pg_stat_activity GROUP BY state;
        ```
    3.  If connections are maxed out, verify connection pool limits in the `DATABASE_URL` configurations.

### 2. High Queue Depth Alert
*   **Symptoms**: Queue monitor triggers high watermark alerts.
*   **Causes**: Downstream webhook endpoints are offline, or worker concurrency is too low.
*   **Resolution**:
    1.  Check worker processing state via logs:
        ```bash
        docker-compose logs -f queueforge | grep "Processing"
        ```
    2.  Verify destination webhook health: check if circuit breakers are `OPEN` in the logs.
    3.  Dynamically increase worker concurrency limits in environment variables.

### 3. Circuit Breaker Trips `OPEN`
*   **Symptoms**: Outbound deliveries fail instantly with `CircuitBreakerError` without reaching the destination.
*   **Causes**: Downstream system returned multiple HTTP 5xx codes.
*   **Resolution**:
    1.  Inspect logged errors to discover failure context.
    2.  Once downstream service resolves, check if circuit moves back to `HALF_OPEN` after reset timeout.
    3.  Manually force reset the breaker:
        ```redis
        DEL "cb:state:<destination-id>"
        ```

---

## 🔍 Debugging Techniques

### Pino Debug Logs Logging
Temporarily increase logging verbosity in production without rebuilding:
```env
LOG_LEVEL=debug
```

### Inspecting Redis Queues directly
Execute command line queries using redis-cli:
```bash
# Get BullMQ waiting jobs count
redis-cli -n 1 ZCARD "bull:queueforge-test:wait"

# Inspect worker heartbeat keys
redis-cli -n 1 KEYS "heartbeat:*"
```

# Advanced Rate Limiting

QueueForge rate limiting architecture using sliding window counters and token buckets.

---

## 🏗️ Design
*   **Sliding Window**: Precise requests count registry within rolling windows (typically 1 minute).
*   **Token Bucket**: Bursty traffic allowance based on capacity refills rates.

---

## 📈 Compliance Headers
HTTP responses contain headers complying with standard rates limits RFCs:
*   `X-RateLimit-Limit`: Maximum capacity.
*   `X-RateLimit-Remaining`: Remaining request counts.
*   `X-RateLimit-Reset`: Timestamp when window resets.
*   `Retry-After`: Delay time in seconds.

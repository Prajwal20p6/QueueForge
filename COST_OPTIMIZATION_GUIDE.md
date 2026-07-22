# Cost Optimization Guide

Best practices to minimize cloud infrastructure costs.

---

## 📈 Optimization Strategies
*   **Resource Sizing**: Profile worker CPU limits and memory limits to restrict waste.
*   **Database Archiving**: Prune or move completed TaskResult records older than 30 days to cold storage backup buckets.
*   **Redis Cache TTL**: Limit token bucket keys TTL to avoid memory creep.

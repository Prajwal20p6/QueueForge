# Scaling Procedures

Instructions to adjust system capacity under traffic spikes.

---

## 📈 Worker Replicas
Scale worker pods dynamically in Kubernetes:
```bash
kubectl scale deployment queueforge-worker --replicas=5 -n queueforge
```

---

## 🏗️ Redis Capacity
*   Scale memory allocations for AOF/RDB caches.
*   Enable Redis Cluster sharding to split workload partitions.

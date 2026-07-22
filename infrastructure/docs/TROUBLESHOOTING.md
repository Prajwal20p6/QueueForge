# QueueForge Troubleshooting Guide

## Common Issues
### Pod failing liveness probe
- Check database and Redis connectivity.
- Verify environment variables in Secret/ConfigMap.

### Workers consuming jobs slowly
- Inspect BullMQ Redis memory usage.
- Increase worker deployment replica count or job concurrency.

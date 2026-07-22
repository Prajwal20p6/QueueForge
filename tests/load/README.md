# Load Testing Guide

This directory contains K6 load testing scripts to verify QueueForge ingestion performance.

---

## 🏃 Running Load Tests

To run K6 load test scenarios, use the run command helper:
```bash
./scripts/run-load-test.sh ramp
```
Or execute K6 directly:
```bash
k6 run tests/load/scenarios/ramp.scenario.js
```

---

## 📋 Scenarios

1.  **Ramp**: Tests ingestion scaling up from 0 to 500 RPS.
2.  **Sustained**: Pings at a constant 300 RPS for 10 minutes.
3.  **Spike**: Simulates a traffic burst up to 1000 RPS for 30 seconds.
4.  **Soak**: Endurance test of 100 RPS for 2 hours to check for memory leaks.
5.  **Stress**: Increments requests loads until the breaking point.

---

## 📊 Threshold Assertions
*   **P95 Ingestion Latency**: < 200ms
*   **HTTP Request Failure Rate**: < 1.0%
*   **E2E Delivery Success**: > 99.0%

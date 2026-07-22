#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# System Benchmarks Runner script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[Benchmark] Compiling and running TypeScript benchmarks suite...\e[0m"

npx ts-node tests/benchmarks/index.ts

echo -e "\e[32m[Benchmark] All pings and HMAC validation benchmark loops completed!\e[0m"

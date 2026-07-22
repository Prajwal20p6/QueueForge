#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# redis-cli CLI connection wrapper script
# ──────────────────────────────────────────────────────────────────────────────

CMD="${1:-PING}"
shift || true
ARGS="$@"

echo -e "\e[32m[Redis-Cli] Executing query cmd: ${CMD} ${ARGS}...\e[0m"

# Execute command on redis-cli pointing to compose host
docker-compose exec -T redis redis-cli $CMD $ARGS

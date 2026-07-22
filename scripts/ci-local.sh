#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Local CI Pipeline Simulation Script
# ──────────────────────────────────────────────────────────────────────────────

echo -e "\e[32m[CI-Local] Commencing local continuous integration pipeline simulation...\e[0m"

# 1. Styles Linting check
bash ./scripts/lint.sh

# 2. TypeScript compilation validation
npm run typecheck

# 3. Unit testing suite execution
npm run test:unit

# 4. Integration testing suite execution
npm run test:integration

# 5. Build check
bash ./scripts/build.sh

echo -e "\e[32m[CI-Local] Local CI pipeline execution completed successfully! ✓\e[0m"
exit 0

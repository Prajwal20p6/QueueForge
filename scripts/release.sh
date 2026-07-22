#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Tag & Release Preparation Script
# ──────────────────────────────────────────────────────────────────────────────

VERSION="$1"

if [ -z "$VERSION" ]; then
  echo -e "\e[31m[Release] Error: Please specify the version tag to release (e.g. 1.1.0).\e[0m"
  exit 1
fi

echo -e "\e[32m[Release] Commencing release tasks for version: ${VERSION}...\e[0m"

# 1. Update version in package file
npm version "$VERSION" --no-git-tag-version

# 2. Re-compile target
bash ./scripts/build.sh

# 3. Create Git Commit and tag release
git add package.json package-lock.json
git commit -m "chore(release): bump version to ${VERSION}" || true
git tag -a "v${VERSION}" -m "Release v${VERSION}"

echo -e "\e[32m[Release] Release prepared successfully! Push tag to trigger deploy workflows:\e[0m"
echo -e "          git push origin main --tags"

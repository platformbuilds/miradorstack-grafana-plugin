#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

pushd "$REPO_ROOT/datasource" > /dev/null
npm run test:ci
npm run typecheck
export GOCACHE="$REPO_ROOT/.cache/go"
mkdir -p "$GOCACHE"
GO111MODULE=on go test ./...
popd > /dev/null

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
REPO_URL="https://github.com/wshobson/agents.git"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

git clone --depth 1 "$REPO_URL" "$TEMP_DIR"

rsync -a --delete \
  --exclude ".git" \
  --exclude "README.md" \
  "$TEMP_DIR/" "$ROOT_DIR/agents/"

printf "Synced agents into %s\n" "$ROOT_DIR/agents"

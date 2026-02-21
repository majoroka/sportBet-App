#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${REPO_DIR}/.git/auto-pull.log"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >> "$LOG_FILE"
}

cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  log "Skip: current branch is '$CURRENT_BRANCH' (expected main)."
  exit 0
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  log 'Skip: working tree has local tracked changes.'
  exit 0
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  log 'Skip: remote origin not configured.'
  exit 0
fi

if ! git fetch --quiet origin main; then
  log 'Skip: fetch failed.'
  exit 0
fi

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse origin/main)"

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
  log 'No updates available.'
  exit 0
fi

if git pull --ff-only --quiet origin main; then
  log "Pulled updates: $LOCAL_SHA -> $REMOTE_SHA"
else
  log 'Pull failed (non-fast-forward or conflict).'
fi

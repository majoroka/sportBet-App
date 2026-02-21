#!/usr/bin/env bash
set -euo pipefail

AGENT_NAME="com.sportbet.autopull"
PLIST_PATH="$HOME/Library/LaunchAgents/$AGENT_NAME.plist"

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"

echo "Uninstalled: $AGENT_NAME"

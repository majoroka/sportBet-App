#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
AGENT_NAME="com.sportbet.autopull"
AGENT_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$AGENT_DIR/$AGENT_NAME.plist"
AUTO_PULL_SCRIPT="$REPO_DIR/scripts/automation/auto-pull.sh"

mkdir -p "$AGENT_DIR"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$AGENT_NAME</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>$AUTO_PULL_SCRIPT</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>StartInterval</key>
  <integer>1800</integer>

  <key>StandardOutPath</key>
  <string>/tmp/$AGENT_NAME.out.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/$AGENT_NAME.err.log</string>
</dict>
</plist>
PLIST

chmod 644 "$PLIST_PATH"
chmod +x "$AUTO_PULL_SCRIPT"

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl kickstart -k "gui/$(id -u)/$AGENT_NAME"

echo "Installed and started: $AGENT_NAME"
echo "Interval: every 30 minutes"
echo "Plist: $PLIST_PATH"

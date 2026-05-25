#!/bin/bash
set -e
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENT_DIR" "$SRC_DIR/logs"

cp "$SRC_DIR/com.mateotelfer.careeraiexplorer.server.plist" "$LAUNCH_AGENT_DIR/"
cp "$SRC_DIR/com.mateotelfer.careeraiexplorer.warmer.plist" "$LAUNCH_AGENT_DIR/"

launchctl unload "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.server.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.warmer.plist" 2>/dev/null || true

launchctl load -w "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.server.plist"
launchctl load -w "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.warmer.plist"

echo "✓ LaunchAgents installed and started."
echo "  Server: launchctl list | grep careeraiexplorer"
echo "  Logs:   $SRC_DIR/logs/"

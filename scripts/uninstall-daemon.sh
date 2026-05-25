#!/bin/bash
set -e
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
launchctl unload "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.server.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.warmer.plist" 2>/dev/null || true
rm -f "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.server.plist"
rm -f "$LAUNCH_AGENT_DIR/com.mateotelfer.careeraiexplorer.warmer.plist"
echo "✓ LaunchAgents removed."

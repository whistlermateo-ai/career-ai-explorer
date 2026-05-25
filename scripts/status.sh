#!/bin/bash
echo "── LaunchAgent status ──"
launchctl list | grep careeraiexplorer || echo "  (no agents loaded)"
echo ""
echo "── Server health ──"
curl -s -o /dev/null -w "  HTTP %{http_code} in %{time_total}s\n" http://localhost:3001/health || echo "  Server NOT responding"
echo ""
echo "── Recent server log (last 20 lines) ──"
tail -n 20 "$(dirname "${BASH_SOURCE[0]}")/logs/server.out.log" 2>/dev/null || echo "  (no log yet)"

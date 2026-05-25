#!/bin/bash
# sync-bundle.sh — Copies the shareable subset of this project into a sync
# folder (Google Drive / iCloud / Dropbox). Run this after editing if you
# want the teacher's copy to update.
#
# Usage:
#   ./scripts/sync-bundle.sh                                    # uses default destination
#   ./scripts/sync-bundle.sh "/path/to/Drive/folder"            # explicit destination
#   DEST="/path/to/dest" ./scripts/sync-bundle.sh               # via env var
#
# What gets included:
#   - All HTML pages (constellation, mockup, index redirect)
#   - All docs (README, SETUP, SOURCES, CHAT-TRANSCRIPT)
#   - dist/precomputed/ (the demo-mode bundle — 61 occupations)
#   - server/ (excluding node_modules + cache so they don't conflict)
#   - scripts/ (so the teacher can rebuild the bundle if needed)
#   - package.json (root)
#
# What gets EXCLUDED:
#   - server/node_modules  (the teacher will run `npm install` per SETUP.md)
#   - server/cache/        (her cache is separate from yours)
#   - scripts/logs/        (your daemon's log files)
#   - .DS_Store, .git, .claude, anything else local

set -e

# Resolve the project root regardless of where the script is called from.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Destination — argument > env var > default.
DEST="${1:-${DEST:-$HOME/CareerAIExplorer-Shared}}"

if [ -z "$DEST" ]; then
  echo "ERROR: destination not provided. Pass as argument or set DEST env var."
  exit 1
fi

mkdir -p "$DEST"

echo "Syncing Career AI Explorer to: $DEST"
echo "From:                          $PROJECT_ROOT"
echo

# Refresh the precomputed bundle from the latest cache before we copy.
# (Cheap — runs in well under a second.)
echo "→ Rebuilding precomputed bundle from cache..."
(cd "$PROJECT_ROOT" && node scripts/build-precomputed.js 2>&1 | grep -E "^Built|Bundle:" || true)
echo

# Use rsync with --delete so the destination is an exact mirror (minus excludes).
# --archive preserves timestamps + permissions.
echo "→ Copying files..."
rsync -a --delete \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude '.claude' \
  --exclude 'node_modules' \
  --exclude 'server/cache' \
  --exclude 'scripts/logs' \
  --exclude '.env' \
  --exclude 'OVERNIGHT_BUILD_SUMMARY.md' \
  --exclude 'TRANSCRIPT.md' \
  --exclude 'UPDATE-WORKFLOW.md' \
  --exclude 'entry-mockup-a.html' \
  --exclude 'entry-mockup-c.html' \
  --exclude 'presentation.html' \
  --exclude 'ui-directions.html' \
  --exclude 'electron-main.js' \
  --include '/' \
  --include 'index.html' \
  --include 'constellation.html' \
  --include 'mockup.html' \
  --include 'README.md' \
  --include 'SETUP.md' \
  --include 'SOURCES.md' \
  --include 'CHAT-TRANSCRIPT.md' \
  --include 'package.json' \
  --include 'package-lock.json' \
  --include 'scripts/***' \
  --include 'server/***' \
  --include 'dist/***' \
  --exclude '*' \
  "$PROJECT_ROOT/" "$DEST/"

echo
echo "Sync complete."
echo
echo "Teacher's experience:"
echo "  1. Cloud sync (Drive / iCloud / etc) will pick up the changes automatically."
echo "  2. She opens 'index.html' from the synced folder to use the program."
echo
echo "To check what was written:"
echo "  ls \"$DEST\""

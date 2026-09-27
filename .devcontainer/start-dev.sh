#!/usr/bin/env bash
# Starts the Vite dev server in the background as soon as the Codespace
# starts, so the preview port opens automatically without typing any
# command — useful when connecting from a phone.
set -e
cd "$(dirname "$0")/../app"

if pgrep -f "vite" > /dev/null; then
  exit 0
fi

nohup npm run dev -- --port 5173 > /tmp/vite-dev.log 2>&1 &
disown

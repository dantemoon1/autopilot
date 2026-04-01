#!/usr/bin/env bash
set -euo pipefail

# Start local development environment
# Sets extension to localhost and starts the server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../autopilot-server"
EXT_CONFIG="$SCRIPT_DIR/packages/extension/config.js"

if [ ! -d "$SERVER_DIR" ]; then
  echo "Error: autopilot-server not found at $SERVER_DIR"
  echo "Make sure both repos are in the same parent directory."
  exit 1
fi

cat > "$EXT_CONFIG" << 'EOF'
// Server configuration (LOCAL DEV)
const API_URL = "http://localhost:8080";
const WS_URL = "ws://localhost:8080";
EOF

echo "Extension config set to localhost:8080"
echo "Load unpacked from packages/extension/ in chrome://extensions"
echo "Starting server..."
echo ""

cd "$SERVER_DIR" && npm run dev

#!/usr/bin/env bash
set -euo pipefail

# Build extension zip for Chrome Web Store submission
# Resets config to production and strips the dev-only "key" field

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$SCRIPT_DIR/packages/extension"
OUT="$EXT_DIR/store/autopilot-extension.zip"
TMP_DIR=$(mktemp -d)

echo "Building extension zip..."

# Copy extension files (exclude store assets)
cp "$EXT_DIR"/*.js "$TMP_DIR/"
cp "$EXT_DIR"/*.html "$TMP_DIR/"
cp "$EXT_DIR"/*.css "$TMP_DIR/"
cp -r "$EXT_DIR/icons" "$TMP_DIR/"

# Always use production config in the zip
cat > "$TMP_DIR/config.js" << 'EOF'
// Server configuration
const API_URL = "https://autopilot-relay.fly.dev";
const WS_URL = "wss://autopilot-relay.fly.dev";
EOF

# Copy manifest without the key field
python3 -c "
import json
with open('$EXT_DIR/manifest.json') as f:
    m = json.load(f)
m.pop('key', None)
with open('$TMP_DIR/manifest.json', 'w') as f:
    json.dump(m, f, indent=2)
    f.write('\n')
"

# Also reset local config back to production
cat > "$EXT_DIR/config.js" << 'EOF'
// Server configuration
const API_URL = "https://autopilot-relay.fly.dev";
const WS_URL = "wss://autopilot-relay.fly.dev";
EOF

# Zip it up
rm -f "$OUT"
(cd "$TMP_DIR" && zip -r - .) > "$OUT"
rm -rf "$TMP_DIR"

echo "Done: $OUT"
echo "Version: $(python3 -c "import json; print(json.load(open('$EXT_DIR/manifest.json'))['version'])")"
echo "Config reset to production."

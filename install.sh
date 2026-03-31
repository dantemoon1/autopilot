#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/autopilot"
HOST_NAME="com.profile_router.host"
EXTENSION_ID="eifgnohgbaefkgpgiipagieecnfjkome"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "autopilot - installer"
echo "====================="
echo ""

# Check python3 is available
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required but not found"
  exit 1
fi

# Browser registry: name|app_path|native_hosts_dir
BROWSERS=(
  "Chrome|/Applications/Google Chrome.app|$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "Brave|/Applications/Brave Browser.app|$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "Edge|/Applications/Microsoft Edge.app|$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
  "Arc|/Applications/Arc.app|$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"
  "Helium|/Applications/Helium.app|$HOME/Library/Application Support/net.imput.helium/NativeMessagingHosts"
)

# Detect installed browsers
DETECTED=()
for entry in "${BROWSERS[@]}"; do
  IFS='|' read -r name app_path native_dir <<< "$entry"
  if [ -d "$app_path" ]; then
    DETECTED+=("$entry")
    echo "  Detected: $name"
  fi
done

echo ""

if [ ${#DETECTED[@]} -eq 0 ]; then
  echo "Error: No supported browsers found."
  echo "Supported: Chrome, Brave, Edge, Arc, Helium"
  exit 1
fi

# Create install directory
mkdir -p "$INSTALL_DIR"

# Copy native host script
cp "$SCRIPT_DIR/packages/native-host/host.py" "$INSTALL_DIR/host.py"
chmod +x "$INSTALL_DIR/host.py"

# Copy uninstaller
cp "$SCRIPT_DIR/uninstall.sh" "$INSTALL_DIR/uninstall.sh"
chmod +x "$INSTALL_DIR/uninstall.sh"

# Create default config if it doesn't exist
if [ ! -f "$INSTALL_DIR/config.json" ]; then
  echo '{"rules": []}' > "$INSTALL_DIR/config.json"
fi

# Install native messaging host manifest for each detected browser
echo "Installing native helper..."
for entry in "${DETECTED[@]}"; do
  IFS='|' read -r name app_path native_dir <<< "$entry"
  mkdir -p "$native_dir"
  cat > "$native_dir/$HOST_NAME.json" <<EOF
{
  "name": "$HOST_NAME",
  "description": "autopilot - opens URLs in the correct browser profile",
  "path": "$INSTALL_DIR/host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF
  echo "  $name: $native_dir/$HOST_NAME.json"
done

echo ""
echo "Helper: $INSTALL_DIR/host.py"
echo ""
echo "Done!"
echo "Uninstall later with:"
echo "  bash $INSTALL_DIR/uninstall.sh"

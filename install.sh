#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/autopilot"
NATIVE_HOSTS_DIR="$HOME/Library/Application Support/net.imput.helium/NativeMessagingHosts"
HOST_NAME="com.profile_router.host"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "autopilot - installer"
echo "====================="
echo ""

# Check Helium is installed
if [ ! -d "/Applications/Helium.app" ]; then
  echo "Error: Helium browser not found at /Applications/Helium.app"
  exit 1
fi

# Check python3 is available
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required but not found"
  exit 1
fi

# Check Helium data directory exists
if [ ! -d "$HOME/Library/Application Support/net.imput.helium" ]; then
  echo "Error: Helium data directory not found. Have you run Helium at least once?"
  exit 1
fi

# Create install directory
mkdir -p "$INSTALL_DIR"

# Copy native host script
cp "$SCRIPT_DIR/packages/native-host/host.py" "$INSTALL_DIR/host.py"
chmod +x "$INSTALL_DIR/host.py"

# Copy uninstaller so users can remove the helper later without the repo
cp "$SCRIPT_DIR/uninstall.sh" "$INSTALL_DIR/uninstall.sh"
chmod +x "$INSTALL_DIR/uninstall.sh"

# Create default config if it doesn't exist
if [ ! -f "$INSTALL_DIR/config.json" ]; then
  echo '{"rules": []}' > "$INSTALL_DIR/config.json"
fi

# Create native messaging host manifest with correct path
mkdir -p "$NATIVE_HOSTS_DIR"
cat > "$NATIVE_HOSTS_DIR/$HOST_NAME.json" <<EOF
{
  "name": "$HOST_NAME",
  "description": "autopilot - opens URLs in the correct browser profile",
  "path": "$INSTALL_DIR/host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://eifgnohgbaefkgpgiipagieecnfjkome/"
  ]
}
EOF

echo "Native helper installed:"
echo "  Host script: $INSTALL_DIR/host.py"
echo "  Manifest:    $NATIVE_HOSTS_DIR/$HOST_NAME.json"
echo ""

# Check if extension is already loaded in any profile
EXTENSION_PATH="$SCRIPT_DIR/packages/extension"
echo "Extension directory: $EXTENSION_PATH"
echo ""

echo "Next steps:"
echo "  1. Open helium://extensions in each profile"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' and select:"
echo "     $EXTENSION_PATH"
echo "  4. Click the extension icon to configure URL rules"
echo ""

# Offer to open extensions page in both profiles
read -rp "Open helium://extensions in both profiles now? [Y/n] " answer
answer="${answer:-Y}"

if [[ "$answer" =~ ^[Yy] ]]; then
  /Applications/Helium.app/Contents/MacOS/Helium --profile-directory="Default" "helium://extensions" &
  sleep 1
  /Applications/Helium.app/Contents/MacOS/Helium --profile-directory="Profile 1" "helium://extensions" &
  echo ""
  echo "Opened extensions page in both profiles."
fi

echo ""
echo "Done!"
echo "Uninstall later with:"
echo "  bash $INSTALL_DIR/uninstall.sh"

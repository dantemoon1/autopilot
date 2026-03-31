#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/autopilot"
NATIVE_HOSTS_DIR="$HOME/Library/Application Support/net.imput.helium/NativeMessagingHosts"
HOST_NAME="com.profile_router.host"

echo "autopilot - uninstaller"
echo "======================="
echo ""

# Remove native messaging host manifest
if [ -f "$NATIVE_HOSTS_DIR/$HOST_NAME.json" ]; then
  rm "$NATIVE_HOSTS_DIR/$HOST_NAME.json"
  echo "Removed: $NATIVE_HOSTS_DIR/$HOST_NAME.json"
fi

# Remove installed host script
if [ -d "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  echo "Removed: $INSTALL_DIR"
fi

echo ""
echo "Native helper removed."
echo "To fully uninstall, remove the extension from the browser's extensions page in each profile."

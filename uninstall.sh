#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/autopilot"
NATIVE_HOSTS_DIR="$HOME/Library/Application Support/net.imput.helium/NativeMessagingHosts"
HOST_NAME="com.profile_router.host"
PURGE=false

if [[ "${1:-}" == "--purge" ]]; then
  PURGE=true
fi

echo "autopilot - uninstaller"
echo "======================="
echo ""

# Remove native messaging host manifest
if [ -f "$NATIVE_HOSTS_DIR/$HOST_NAME.json" ]; then
  rm "$NATIVE_HOSTS_DIR/$HOST_NAME.json"
  echo "Removed: $NATIVE_HOSTS_DIR/$HOST_NAME.json"
fi

# Remove installed host script
if [ -f "$INSTALL_DIR/host.py" ]; then
  rm "$INSTALL_DIR/host.py"
  echo "Removed: $INSTALL_DIR/host.py"
fi

echo ""
if [ -f "$INSTALL_DIR/uninstall.sh" ]; then
  rm "$INSTALL_DIR/uninstall.sh"
  echo "Removed: $INSTALL_DIR/uninstall.sh"
fi

if [ "$PURGE" = true ]; then
  if [ -f "$INSTALL_DIR/config.json" ]; then
    rm "$INSTALL_DIR/config.json"
    echo "Removed: $INSTALL_DIR/config.json"
  fi

  if [ -d "$INSTALL_DIR" ]; then
    rmdir "$INSTALL_DIR" 2>/dev/null || true
  fi
  echo ""
  echo "Native helper and saved rules removed."
else
  if [ -d "$INSTALL_DIR" ]; then
    rmdir "$INSTALL_DIR" 2>/dev/null || true
  fi
  echo "Native helper removed."
  echo "Saved rules kept at: $INSTALL_DIR/config.json"
  echo "Run with --purge to remove saved rules too."
fi

echo ""
echo "To fully uninstall, remove the extension from the browser's extensions page in each profile."

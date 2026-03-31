#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/autopilot"
HOST_NAME="com.profile_router.host"
PURGE=false

if [[ "${1:-}" == "--purge" ]]; then
  PURGE=true
fi

echo "autopilot - uninstaller"
echo "======================="
echo ""

# All supported browser NativeMessagingHosts directories
NATIVE_DIRS=(
  "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
  "$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"
  "$HOME/Library/Application Support/net.imput.helium/NativeMessagingHosts"
)

# Remove native messaging host manifest from all browsers
for dir in "${NATIVE_DIRS[@]}"; do
  if [ -f "$dir/$HOST_NAME.json" ]; then
    rm "$dir/$HOST_NAME.json"
    echo "Removed: $dir/$HOST_NAME.json"
  fi
done

# Remove installed host script
if [ -f "$INSTALL_DIR/host.py" ]; then
  rm "$INSTALL_DIR/host.py"
  echo "Removed: $INSTALL_DIR/host.py"
fi

if [ -f "$INSTALL_DIR/uninstall.sh" ]; then
  rm "$INSTALL_DIR/uninstall.sh"
  echo "Removed: $INSTALL_DIR/uninstall.sh"
fi

echo ""

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
  echo "Native helper removed. Rules kept at: $INSTALL_DIR/config.json"
  echo "Run with --purge to remove saved rules too."
fi

echo ""
echo "To fully uninstall, remove the extension from each browser profile's extensions page."

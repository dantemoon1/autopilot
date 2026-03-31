#!/usr/bin/env python3
"""
Profile Router - Native Messaging Host

Bridges the Chrome extension to the OS, allowing it to open URLs
in a specific Helium browser profile.
"""

import json
import os
import struct
import subprocess
import sys

HELIUM_PATH = "/Applications/Helium.app/Contents/MacOS/Helium"
LOCAL_STATE_PATH = os.path.expanduser(
    "~/Library/Application Support/net.imput.helium/Local State"
)
CONFIG_PATH = os.path.expanduser("~/.local/share/autopilot/config.json")


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) < 4:
        return None
    length = struct.unpack("=I", raw_length)[0]
    data = sys.stdin.buffer.read(length)
    return json.loads(data)


def send_message(message):
    encoded = json.dumps(message).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("=I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def list_profiles():
    with open(LOCAL_STATE_PATH, "r") as f:
        data = json.load(f)
    cache = data.get("profile", {}).get("info_cache", {})
    return [
        {"directory": dir_name, "name": info.get("name", dir_name)}
        for dir_name, info in cache.items()
    ]


def get_rules():
    if not os.path.exists(CONFIG_PATH):
        return []
    with open(CONFIG_PATH, "r") as f:
        data = json.load(f)
    return data.get("rules", [])


def save_rules(rules):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump({"rules": rules}, f, indent=2)


def open_in_profile(url, profile_directory):
    if not os.path.exists(HELIUM_PATH):
        raise FileNotFoundError(f"Browser not found at {HELIUM_PATH}")
    subprocess.Popen(
        [HELIUM_PATH, f"--profile-directory={profile_directory}", url],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main():
    message = read_message()
    if not message:
        return

    action = message.get("action")

    if action == "open":
        url = message.get("url", "")
        profile = message.get("profile", "")
        if not url or not profile:
            send_message({"success": False, "error": "Missing url or profile"})
            return
        if not url.startswith(("http://", "https://")):
            send_message({"success": False, "error": "Only http/https URLs allowed"})
            return
        try:
            open_in_profile(url, profile)
            send_message({"success": True})
        except Exception as e:
            send_message({"success": False, "error": str(e)})

    elif action == "list_profiles":
        try:
            profiles = list_profiles()
            send_message({"profiles": profiles})
        except Exception as e:
            send_message({"error": str(e)})

    elif action == "get_rules":
        try:
            rules = get_rules()
            send_message({"rules": rules})
        except Exception as e:
            send_message({"error": str(e)})

    elif action == "save_rules":
        try:
            rules = message.get("rules", [])
            save_rules(rules)
            send_message({"success": True})
        except Exception as e:
            send_message({"error": str(e)})

    else:
        send_message({"error": f"Unknown action: {action}"})


if __name__ == "__main__":
    main()

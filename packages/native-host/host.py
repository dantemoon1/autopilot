#!/usr/bin/env python3
"""
Profile Router - Native Messaging Host

Bridges the browser extension to the OS, allowing it to open URLs
in a specific browser profile across multiple Chromium browsers.
"""

import ctypes
import ctypes.util
import json
import os
import struct
import subprocess
import sys

BROWSERS = {
    "chrome": {
        "name": "Chrome",
        "binary": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "local_state": os.path.expanduser(
            "~/Library/Application Support/Google/Chrome/Local State"
        ),
    },
    "brave": {
        "name": "Brave",
        "binary": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "local_state": os.path.expanduser(
            "~/Library/Application Support/BraveSoftware/Brave-Browser/Local State"
        ),
    },
    "edge": {
        "name": "Edge",
        "binary": "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "local_state": os.path.expanduser(
            "~/Library/Application Support/Microsoft Edge/Local State"
        ),
    },
    "arc": {
        "name": "Arc",
        "binary": "/Applications/Arc.app/Contents/MacOS/Arc",
        "local_state": os.path.expanduser(
            "~/Library/Application Support/Arc/User Data/Local State"
        ),
    },
    "helium": {
        "name": "Helium",
        "binary": "/Applications/Helium.app/Contents/MacOS/Helium",
        "local_state": os.path.expanduser(
            "~/Library/Application Support/net.imput.helium/Local State"
        ),
    },
}

EXTENSION_ID = "eifgnohgbaefkgpgiipagieecnfjkome"
CONFIG_PATH = os.path.expanduser("~/.local/share/autopilot/config.json")


def has_extension(data_dir, profile_directory):
    """Check if the extension is installed in a profile."""
    profile_path = os.path.join(data_dir, profile_directory)
    for prefs_file in ("Secure Preferences", "Preferences"):
        prefs_path = os.path.join(profile_path, prefs_file)
        if not os.path.exists(prefs_path):
            continue
        try:
            with open(prefs_path, "r") as f:
                data = json.load(f)
            settings = data.get("extensions", {}).get("settings", {})
            if EXTENSION_ID in settings:
                return True
        except Exception:
            continue
    return False


_libc = ctypes.CDLL(ctypes.util.find_library("c"))


def _proc_pidpath(pid):
    """Get the executable path of a process by PID (macOS)."""
    buf = ctypes.create_string_buffer(4096)
    ret = _libc.proc_pidpath(pid, buf, 4096)
    return buf.value.decode("utf-8") if ret > 0 else None


def detect_calling_browser():
    """Detect which browser spawned this native host via the process tree."""
    app_prefixes = {}
    for browser_id, info in BROWSERS.items():
        binary = info["binary"]
        idx = binary.find(".app/")
        if idx >= 0:
            app_prefixes[binary[: idx + 4]] = browser_id

    pid = os.getppid()
    for _ in range(5):
        if pid <= 1:
            break
        path = _proc_pidpath(pid)
        if path:
            for prefix, browser_id in app_prefixes.items():
                if path.startswith(prefix):
                    return browser_id
        try:
            out = subprocess.run(
                ["ps", "-p", str(pid), "-o", "ppid="],
                capture_output=True, text=True, timeout=2,
            ).stdout.strip()
            pid = int(out)
        except Exception:
            break
    return None


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
    all_profiles = []
    for browser_id, info in BROWSERS.items():
        local_state = info["local_state"]
        if not os.path.exists(local_state):
            continue
        data_dir = os.path.dirname(local_state)
        try:
            with open(local_state, "r") as f:
                data = json.load(f)
            cache = data.get("profile", {}).get("info_cache", {})
            for dir_name, profile_info in cache.items():
                all_profiles.append({
                    "browser": browser_id,
                    "directory": dir_name,
                    "name": profile_info.get("name", dir_name),
                    "hasExtension": has_extension(data_dir, dir_name),
                })
        except Exception:
            continue
    return all_profiles


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


def open_in_profile(url, browser_id, profile_directory):
    info = BROWSERS.get(browser_id)
    if not info:
        raise ValueError(f"Unknown browser: {browser_id}")
    if not os.path.exists(info["binary"]):
        raise FileNotFoundError(f"{info['name']} not found at {info['binary']}")
    subprocess.Popen(
        [info["binary"], f"--profile-directory={profile_directory}", url],
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
        browser = message.get("browser", "")
        profile = message.get("profile", "")
        if not url or not browser or not profile:
            send_message({"success": False, "error": "Missing url, browser, or profile"})
            return
        if not url.startswith(("http://", "https://")):
            send_message({"success": False, "error": "Only http/https URLs allowed"})
            return
        try:
            open_in_profile(url, browser, profile)
            send_message({"success": True})
        except Exception as e:
            send_message({"success": False, "error": str(e)})

    elif action == "list_profiles":
        try:
            profiles = list_profiles()
            browser = detect_calling_browser()
            send_message({"profiles": profiles, "callingBrowser": browser})
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

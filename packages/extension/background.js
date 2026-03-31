const NATIVE_HOST = "com.profile_router.host";
const UNINSTALL_URL = "https://dantemoon1.github.io/autopilot/uninstall.html";

const BROWSER_NAMES = {
  chrome: "Chrome",
  brave: "Brave",
  edge: "Edge",
  arc: "Arc",
  helium: "Helium",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.setUninstallURL(UNINSTALL_URL);
  buildContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  buildContextMenu();
});

async function buildContextMenu() {
  await chrome.contextMenus.removeAll();
  try {
    const response = await listProfiles();
    const profiles = (response.profiles || []).filter((p) => p.hasExtension);
    if (profiles.length === 0) return;

    chrome.contextMenus.create({
      id: "autopilot-parent",
      title: "Open in...",
      contexts: ["link"],
    });

    for (const p of profiles) {
      const label = `${BROWSER_NAMES[p.browser] || p.browser} \u2013 ${p.name}`;
      chrome.contextMenus.create({
        id: `autopilot:${p.browser}:${p.directory}`,
        parentId: "autopilot-parent",
        title: label,
        contexts: ["link"],
      });
    }
  } catch {
    // Native host not installed — no context menu
  }
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.menuItemId.startsWith("autopilot:")) return;
  const url = info.linkUrl;
  if (!url || !url.startsWith("http")) return;

  const parts = info.menuItemId.split(":");
  const browser = parts[1];
  const directory = parts.slice(2).join(":");
  try {
    await openInProfile(url, browser, directory);
  } catch (err) {
    console.error("autopilot: context menu open failed", err);
  }
});

function urlMatchesRule(url, rule) {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return false;

    if (rule.type === "keyword") {
      return url.toLowerCase().includes(rule.keyword);
    }

    // Domain matching
    const hostname = parsed.hostname.toLowerCase();
    const domain = rule.domain.toLowerCase();

    const domainMatch = rule.includeSubdomains
      ? hostname === domain || hostname.endsWith("." + domain)
      : hostname === domain;

    return domainMatch;
  } catch {
    return false;
  }
}

function nativeRequest(message) {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connectNative(NATIVE_HOST);

    port.onMessage.addListener((response) => {
      port.disconnect();
      resolve(response);
    });

    port.onDisconnect.addListener(() => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
      }
    });

    port.postMessage(message);
  });
}

function parseProfileKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) return { browser: "", directory: key };
  return { browser: key.slice(0, idx), directory: key.slice(idx + 1) };
}

function profileKey(browser, directory) {
  return `${browser}:${directory}`;
}

async function getConfig() {
  const [storageResult, rulesResponse] = await Promise.all([
    chrome.storage.local.get("currentProfile"),
    nativeRequest({ action: "get_rules" }),
  ]);
  return {
    rules: rulesResponse.rules || [],
    currentProfile: storageResult.currentProfile || null,
  };
}

function openInProfile(url, browser, profileDirectory) {
  return nativeRequest({ action: "open", url, browser, profile: profileDirectory });
}

function listProfiles() {
  return nativeRequest({ action: "list_profiles" });
}

// Relay messages from the popup to the native host
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "list_profiles") {
    listProfiles()
      .then((response) => {
        buildContextMenu();
        sendResponse(response);
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "check_native_host") {
    listProfiles()
      .then(() => sendResponse({ installed: true }))
      .catch(() => sendResponse({ installed: false }));
    return true;
  }

  if (message.action === "get_rules") {
    nativeRequest({ action: "get_rules" })
      .then((response) => sendResponse({ rules: response.rules || [] }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "save_rules") {
    nativeRequest({ action: "save_rules", rules: message.rules })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// Guard against redirect loops — track recently redirected URLs
const recentRedirects = new Map();

// Intercept navigations
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle top-level navigations
  if (details.frameId !== 0) return;

  // Skip if this URL was just redirected here (loop prevention)
  const lastRedirect = recentRedirects.get(details.url);
  if (lastRedirect && Date.now() - lastRedirect < 3000) return;

  const { rules, currentProfile } = await getConfig();
  if (!currentProfile || rules.length === 0) return;

  const current = parseProfileKey(currentProfile);

  for (const rule of rules) {
    if (
      urlMatchesRule(details.url, rule) &&
      profileKey(rule.browser, rule.profileDirectory) !== currentProfile
    ) {
      try {
        // Mark as recently redirected
        recentRedirects.set(details.url, Date.now());

        // Open in the correct profile first — only close tab if it succeeds
        const result = await openInProfile(details.url, rule.browser, rule.profileDirectory);
        if (result.success) {
          await chrome.tabs.remove(details.tabId);
        }
      } catch (err) {
        console.error("autopilot: failed to redirect", err);
      }
      return;
    }
  }
});

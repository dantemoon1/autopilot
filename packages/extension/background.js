const NATIVE_HOST = "com.profile_router.host";

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

function openInProfile(url, profileDirectory) {
  return nativeRequest({ action: "open", url, profile: profileDirectory });
}

function listProfiles() {
  return nativeRequest({ action: "list_profiles" });
}

// Relay messages from the popup to the native host
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "list_profiles") {
    listProfiles()
      .then((response) => sendResponse({ profiles: response.profiles }))
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

  for (const rule of rules) {
    if (
      urlMatchesRule(details.url, rule) &&
      rule.profileDirectory !== currentProfile
    ) {
      try {
        // Mark as recently redirected
        recentRedirects.set(details.url, Date.now());

        // Open in the correct profile first — only close tab if it succeeds
        const result = await openInProfile(details.url, rule.profileDirectory);
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

importScripts("config.js");

const NATIVE_HOST = "com.profile_router.host";
const EXPECTED_HOST_VERSION = "1.0.0";
const UNINSTALL_URL = "https://autopilotapp.co/uninstall.html";
// API_URL and WS_URL are loaded from config.js (production: autopilot-relay.fly.dev)
// For local development, edit config.js to point to localhost:8080
const GOOGLE_CLIENT_ID =
  "245847655493-5fg3e54qu09lmvcsrdad4is2i1k8a01t.apps.googleusercontent.com";

const BROWSER_NAMES = {
  chrome: "Chrome",
  brave: "Brave",
  edge: "Edge",
  arc: "Arc",
  helium: "Helium",
};

// ── Lifecycle ──

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.setUninstallURL(UNINSTALL_URL);
  startup();
});

chrome.runtime.onStartup.addListener(startup);

async function startup() {
  buildContextMenu();
  const mode = await getMode();
  if (mode === "paid") connectRelay();
}

// ── Mode helpers ──

async function getMode() {
  const { mode } = await chrome.storage.local.get("mode");
  return mode || "free";
}

async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get("authToken");
  return authToken;
}

// ── Server API (paid mode) ──

async function serverFetch(path, options = {}) {
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    await chrome.storage.local.remove(["mode", "authToken", "user", "paidProfileId"]);
    disconnectRelay();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

// ── Google Sign-In (tab-based for cross-browser support) ──

const AUTH_CALLBACK_URL = "https://autopilotapp.co/auth-callback.html";

async function signIn() {
  const nonce = crypto.randomUUID();
  await chrome.storage.session.set({ pendingNonce: nonce });
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", AUTH_CALLBACK_URL);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "select_account");

  await chrome.tabs.create({ url: authUrl.toString() });
}

// Receive messages from website pages (external messaging)
// Note: must NOT be async — return true synchronously to keep the channel open
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    const senderUrl = sender.url || "";
    const allowedBase = "https://autopilotapp.co/";
    if (!senderUrl.startsWith(allowedBase)) return;

    if (message.type === "oauth_callback" && message.idToken) {
      handleOAuthCallback(message, sender).then(sendResponse);
      return true;
    }
    if (message.type === "subscription_complete") {
      handleSubscriptionCheck(sender).then(sendResponse);
      return true;
    }
  }
);

async function handleOAuthCallback(message, sender) {
  try {
    const { pendingNonce } = await chrome.storage.session.get("pendingNonce");
    if (!pendingNonce) return { error: "No pending sign-in" };

    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: message.idToken, nonce: pendingNonce }),
    });
    await chrome.storage.session.remove("pendingNonce");
    if (!res.ok) throw new Error("Authentication failed");

    const data = await res.json();
    await chrome.storage.local.set({
      mode: "paid",
      authToken: data.token,
      user: data.user,
    });

    buildContextMenu();
    if (sender.tab?.id) chrome.tabs.remove(sender.tab.id);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

async function handleSubscriptionCheck(sender) {
  try {
    const { subscription } = await serverFetch("/subscription");
    const active = subscription?.status === "active";
    if (active && sender.tab?.id) chrome.tabs.remove(sender.tab.id);
    return { active };
  } catch {
    return { active: false };
  }
}

async function signOut() {
  await disconnectRelay();
  await chrome.storage.local.remove([
    "mode",
    "authToken",
    "user",
    "paidProfileId",
  ]);
  await chrome.contextMenus.removeAll();
  invalidateRulesCache();
}

// ── Offscreen / WebSocket relay (paid mode) ──

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS"],
    justification: "Maintain WebSocket connection for real-time URL routing",
  });
}

async function connectRelay() {
  const token = await getAuthToken();
  const { paidProfileId } = await chrome.storage.local.get("paidProfileId");
  if (!token || !paidProfileId) return;
  await ensureOffscreen();
  // Small delay to ensure offscreen document's listener is ready
  await new Promise((r) => setTimeout(r, 200));
  try {
    await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "connect",
      url: WS_URL,
      token,
      profileId: paidProfileId,
    });
  } catch (err) {
    console.warn("autopilot: connectRelay failed:", err.message);
  }
}

async function disconnectRelay() {
  try {
    chrome.runtime.sendMessage({ target: "offscreen", type: "disconnect" });
  } catch {
    // Offscreen doc might not exist
  }
}

async function routeViaRelay(url, targetProfileId) {
  await ensureOffscreen();
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { target: "offscreen", type: "route", url, targetProfileId },
      resolve
    );
  });
}

// ── Native host helpers (free mode) ──

function nativeRequest(message) {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    port.onMessage.addListener((response) => {
      port.disconnect();
      resolve(response);
    });
    port.onDisconnect.addListener(() => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
    });
    port.postMessage(message);
  });
}

function listProfilesFree() {
  return nativeRequest({ action: "list_profiles" });
}

function openInProfileFree(url, browser, profileDirectory) {
  return nativeRequest({
    action: "open",
    url,
    browser,
    profile: profileDirectory,
  });
}

// ── Shared helpers ──

function isVersionOutdated(current, expected) {
  const c = current.split(".").map(Number);
  const e = expected.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (e[i] || 0)) return true;
    if ((c[i] || 0) > (e[i] || 0)) return false;
  }
  return false;
}

function parseProfileKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) return { browser: "", directory: key };
  return { browser: key.slice(0, idx), directory: key.slice(idx + 1) };
}

function profileKey(browser, directory) {
  return `${browser}:${directory}`;
}

function urlMatchesRule(url, rule) {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return false;
    if (rule.type === "keyword") return url.toLowerCase().includes(rule.keyword);
    const hostname = parsed.hostname.toLowerCase();
    const domain = (rule.domain || "").toLowerCase();
    return rule.includeSubdomains || rule.include_subdomains
      ? hostname === domain || hostname.endsWith("." + domain)
      : hostname === domain;
  } catch {
    return false;
  }
}

// ── Context menu ──

async function buildContextMenu() {
  await chrome.contextMenus.removeAll();
  const mode = await getMode();

  try {
    if (mode === "paid") {
      const { profiles } = await serverFetch("/profiles");
      if (!profiles || profiles.length === 0) return;
      chrome.contextMenus.create({
        id: "autopilot-parent",
        title: "Open in...",
        contexts: ["link"],
      });
      for (const p of profiles) {
        chrome.contextMenus.create({
          id: `paid:${p.id}`,
          parentId: "autopilot-parent",
          title: p.name,
          contexts: ["link"],
        });
      }
    } else {
      const response = await listProfilesFree();
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
          id: `free:${p.browser}:${p.directory}`,
          parentId: "autopilot-parent",
          title: label,
          contexts: ["link"],
        });
      }
    }
  } catch {
    // Not available — skip context menu
  }
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  const url = info.linkUrl;
  if (!url || !url.startsWith("http")) return;
  const id = info.menuItemId;

  try {
    if (typeof id === "string" && id.startsWith("paid:")) {
      const targetProfileId = id.slice(5);
      await routeViaRelay(url, targetProfileId);
    } else if (typeof id === "string" && id.startsWith("free:")) {
      const parts = id.split(":");
      await openInProfileFree(url, parts[1], parts.slice(2).join(":"));
    }
  } catch (err) {
    console.error("autopilot: context menu failed", err);
  }
});

// ── Message relay (popup ↔ background) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Messages from offscreen document
  if (message.source === "offscreen") {
    if (message.type === "open-url" && message.url &&
        (message.url.startsWith("http://") || message.url.startsWith("https://"))) {
      chrome.tabs.create({ url: message.url }).then((tab) => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    }
    if (message.type === "ws-error") {
      console.warn("autopilot: WebSocket error:", message.error);
    }
    return false;
  }

  // Messages from popup
  if (message.action === "get_mode") {
    getMode().then((mode) =>
      chrome.storage.local.get(["user", "paidProfileId"]).then((data) =>
        sendResponse({ mode, user: data.user, paidProfileId: data.paidProfileId })
      )
    );
    return true;
  }

  if (message.action === "sign_in") {
    signIn()
      .then((data) => sendResponse({ success: true, ...data }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "checkout") {
    serverFetch("/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: message.plan }),
    })
      .then(({ url }) => {
        chrome.tabs.create({ url });
        sendResponse({ success: true });
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "billing") {
    serverFetch("/billing", { method: "POST" })
      .then(({ url }) => {
        chrome.tabs.create({ url });
        sendResponse({ success: true });
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "check_subscription") {
    serverFetch("/subscription")
      .then(({ subscription }) => {
        const active = subscription?.status === "active";
        sendResponse({ active, subscription });
      })
      .catch(() => sendResponse({ active: false }));
    return true;
  }

  if (message.action === "sign_out") {
    signOut().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === "detect_browser") {
    // Ask the native host which browser launched it
    listProfilesFree()
      .then((response) => sendResponse({ browser: response.callingBrowser }))
      .catch(() => sendResponse({ browser: null }));
    return true;
  }

  if (message.action === "register_profile") {
    serverFetch("/profiles", {
      method: "POST",
      body: JSON.stringify({ name: message.name, browser: message.browser }),
    })
      .then(async (profile) => {
        await chrome.storage.local.set({ paidProfileId: profile.id });
        connectRelay();
        buildContextMenu();
        sendResponse({ success: true, profile });
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  // ── Free mode handlers ──

  if (message.action === "check_native_host") {
    listProfilesFree()
      .then(() => sendResponse({ installed: true }))
      .catch(() => sendResponse({ installed: false }));
    return true;
  }

  if (message.action === "check_host_version") {
    nativeRequest({ action: "version" })
      .then((res) => {
        const current = res.version || "0.0.0";
        const outdated = isVersionOutdated(current, EXPECTED_HOST_VERSION);
        sendResponse({ version: current, outdated });
      })
      .catch(() => sendResponse({ version: null, outdated: false }));
    return true;
  }

  if (message.action === "list_profiles") {
    getMode().then(async (mode) => {
      try {
        if (mode === "paid") {
          const { profiles } = await serverFetch("/profiles");
          buildContextMenu();
          sendResponse({ profiles });
        } else {
          const response = await listProfilesFree();
          buildContextMenu();
          sendResponse(response);
        }
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true;
  }

  if (message.action === "get_rules") {
    getMode().then(async (mode) => {
      try {
        if (mode === "paid") {
          const { rules } = await serverFetch("/rules");
          sendResponse({ rules });
        } else {
          const response = await nativeRequest({ action: "get_rules" });
          sendResponse({ rules: response.rules || [] });
        }
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true;
  }

  if (message.action === "save_rules") {
    nativeRequest({ action: "save_rules", rules: message.rules })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "add_rule_paid") {
    (async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_URL}/rules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(message.rule),
        });
        if (res.status === 401) {
          await chrome.storage.local.remove(["mode", "authToken", "user", "paidProfileId"]);
          sendResponse({ error: "Session expired" });
          return;
        }
        const data = await res.json();
        if (res.ok) {
          invalidateRulesCache();
          sendResponse({ success: true, rule: data });
        } else {
          sendResponse({ error: data.error });
        }
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }

  if (message.action === "delete_rule_paid") {
    serverFetch(`/rules/${message.ruleId}`, { method: "DELETE" })
      .then(() => { invalidateRulesCache(); sendResponse({ success: true }); })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "reconnect_relay") {
    connectRelay();
    buildContextMenu();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "rename_profile") {
    serverFetch(`/profiles/${message.profileId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: message.name }),
    })
      .then(() => { buildContextMenu(); sendResponse({ success: true }); })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "delete_profile") {
    serverFetch(`/profiles/${message.profileId}`, { method: "DELETE" })
      .then(() => { buildContextMenu(); sendResponse({ success: true }); })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ── Rules cache (paid mode) ──

let cachedRules = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function getCachedRules() {
  if (cachedRules && Date.now() - cacheTime < CACHE_TTL) return cachedRules;
  try {
    const data = await serverFetch("/rules");
    cachedRules = data.rules || [];
    cacheTime = Date.now();
    return cachedRules;
  } catch {
    // Fail closed — don't serve stale rules after fetch failure
    cachedRules = null;
    cacheTime = 0;
    return [];
  }
}

function invalidateRulesCache() {
  cachedRules = null;
  cacheTime = 0;
}

// ── Navigation interception ──

const recentRedirects = new Map();

// Clean up stale redirect entries
function cleanRedirects() {
  if (recentRedirects.size > 1000) recentRedirects.clear();
  const cutoff = Date.now() - 5000;
  for (const [url, time] of recentRedirects) {
    if (time < cutoff) recentRedirects.delete(url);
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  cleanRedirects();
  if (details.frameId !== 0) return;

  const lastRedirect = recentRedirects.get(details.url);
  if (lastRedirect && Date.now() - lastRedirect < 3000) return;

  const mode = await getMode();

  if (mode === "paid") {
    const { paidProfileId } = await chrome.storage.local.get("paidProfileId");
    if (!paidProfileId) return;
    let rules;
    try {
      rules = await getCachedRules();
    } catch {
      return;
    }
    if (rules.length === 0) return;

    for (const rule of rules) {
      if (
        urlMatchesRule(details.url, rule) &&
        rule.target_profile_id !== paidProfileId
      ) {
        try {
          recentRedirects.set(details.url, Date.now());
          const result = await routeViaRelay(details.url, rule.target_profile_id);
          if (result?.ok) {
            await chrome.tabs.remove(details.tabId);
          }
        } catch (err) {
          console.error("autopilot: paid redirect failed", err);
        }
        return;
      }
    }
  } else {
    const [storageResult, rulesResponse] = await Promise.all([
      chrome.storage.local.get("currentProfile"),
      nativeRequest({ action: "get_rules" }).catch(() => ({ rules: [] })),
    ]);
    const currentProfile = storageResult.currentProfile || null;
    const rules = rulesResponse.rules || [];
    if (!currentProfile || rules.length === 0) return;

    for (const rule of rules) {
      if (
        urlMatchesRule(details.url, rule) &&
        profileKey(rule.browser, rule.profileDirectory) !== currentProfile
      ) {
        try {
          recentRedirects.set(details.url, Date.now());
          const result = await openInProfileFree(
            details.url,
            rule.browser,
            rule.profileDirectory
          );
          if (result.success) await chrome.tabs.remove(details.tabId);
        } catch (err) {
          console.error("autopilot: free redirect failed", err);
        }
        return;
      }
    }
  }
});

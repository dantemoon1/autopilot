const NATIVE_HOST = "com.profile_router.host";
const UNINSTALL_URL = "https://dantemoon1.github.io/autopilot/uninstall.html";
const API_URL = "http://localhost:8080"; // TODO: update for production
const WS_URL = "ws://localhost:8080"; // TODO: update for production
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
  });
  if (res.status === 401) {
    await chrome.storage.local.remove(["mode", "authToken", "user", "paidProfileId"]);
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

// ── Google Sign-In (tab-based for cross-browser support) ──

const AUTH_CALLBACK_URL = "https://dantemoon1.github.io/autopilot/auth-callback.html";

async function signIn() {
  const nonce = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", AUTH_CALLBACK_URL);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "select_account");

  // Open Google sign-in in a new tab
  const tab = await chrome.tabs.create({ url: authUrl.toString() });

  // Wait for the tab to redirect to our callback with the token
  const idToken = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Sign-in timed out"));
    }, 120_000);

    function listener(tabId, changeInfo) {
      if (tabId !== tab.id || !changeInfo.url) return;
      if (!changeInfo.url.startsWith(AUTH_CALLBACK_URL)) return;

      chrome.tabs.onUpdated.removeListener(listener);
      clearTimeout(timeout);

      const fragment = new URL(changeInfo.url).hash.slice(1);
      const token = new URLSearchParams(fragment).get("id_token");
      if (token) {
        chrome.tabs.remove(tabId);
        resolve(token);
      } else {
        chrome.tabs.remove(tabId);
        reject(new Error("No ID token returned"));
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });

  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Authentication failed");

  const data = await res.json();
  await chrome.storage.local.set({
    mode: "paid",
    authToken: data.token,
    user: data.user,
  });
  return data;
}

async function signOut() {
  await disconnectRelay();
  await chrome.storage.local.remove([
    "mode",
    "authToken",
    "user",
    "paidProfileId",
  ]);
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
  chrome.runtime.sendMessage({
    target: "offscreen",
    type: "connect",
    url: WS_URL,
    token,
    profileId: paidProfileId,
  });
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
    if (message.type === "open-url" && message.url) {
      chrome.tabs.create({ url: message.url }).then((tab) => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
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

  if (message.action === "list_profiles") {
    getMode().then(async (mode) => {
      try {
        if (mode === "paid") {
          const { profiles } = await serverFetch("/profiles");
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
    serverFetch("/rules", {
      method: "POST",
      body: JSON.stringify(message.rule),
    })
      .then((rule) => sendResponse({ success: true, rule }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "delete_rule_paid") {
    serverFetch(`/rules/${message.ruleId}`, { method: "DELETE" })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ── Navigation interception ──

const recentRedirects = new Map();

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const lastRedirect = recentRedirects.get(details.url);
  if (lastRedirect && Date.now() - lastRedirect < 3000) return;

  const mode = await getMode();

  if (mode === "paid") {
    const { paidProfileId } = await chrome.storage.local.get("paidProfileId");
    if (!paidProfileId) return;
    let rules;
    try {
      const data = await serverFetch("/rules");
      rules = data.rules || [];
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

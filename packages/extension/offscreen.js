// Offscreen document — holds the WebSocket connection alive
// (MV3 service workers sleep after ~30s, killing WebSocket connections)

let ws = null;
let reconnectTimer = null;
let currentUrl = null;
let currentToken = null;
let currentProfileId = null;
const pendingRouteCallbacks = new Map();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== "offscreen") return false;

  if (msg.type === "connect") {
    currentUrl = msg.url;
    currentToken = msg.token;
    currentProfileId = msg.profileId;
    connect();
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === "disconnect") {
    disconnect(true);
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === "route") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const requestId = msg.requestId || "__legacy__";
      ws.send(
        JSON.stringify({
          type: "route",
          url: msg.url,
          targetProfileId: msg.targetProfileId,
          requestId: msg.requestId,
        })
      );
      const timeout = setTimeout(() => {
        pendingRouteCallbacks.delete(requestId);
        sendResponse({ error: "Timeout" });
      }, 5000);
      pendingRouteCallbacks.set(requestId, (result) => {
        clearTimeout(timeout);
        pendingRouteCallbacks.delete(requestId);
        sendResponse(result);
      });
    } else {
      sendResponse({ error: "Not connected" });
      return false;
    }
    return true;
  }

  return false;
});

function connect() {
  disconnect();
  if (!currentUrl || !currentToken || !currentProfileId) return;

  ws = new WebSocket(currentUrl);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "auth",
        token: currentToken,
        profileId: currentProfileId,
      })
    );
  };

  ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    if (msg.type === "authenticated") {
      chrome.runtime.sendMessage({
        source: "offscreen",
        type: "ws-connected",
        connectedProfiles: msg.connectedProfiles,
      });
    }

    if (msg.type === "routed") {
      const pendingRouteCallback = msg.requestId
        ? pendingRouteCallbacks.get(msg.requestId)
        : pendingRouteCallbacks.size === 1
          ? pendingRouteCallbacks.values().next().value
          : pendingRouteCallbacks.get("__legacy__");
      if (pendingRouteCallback) pendingRouteCallback({ ok: true });
    }

    if (msg.type === "open") {
      chrome.runtime.sendMessage({
        source: "offscreen",
        type: "open-url",
        url: msg.url,
        fromProfileId: msg.fromProfileId || null,
      });
    }

    if (msg.type === "error") {
      const pendingRouteCallback = msg.requestId
        ? pendingRouteCallbacks.get(msg.requestId)
        : pendingRouteCallbacks.size === 1
          ? pendingRouteCallbacks.values().next().value
          : pendingRouteCallbacks.get("__legacy__");
      if (pendingRouteCallback) pendingRouteCallback({ error: msg.error });
      chrome.runtime.sendMessage({
        source: "offscreen",
        type: "ws-error",
        error: msg.error,
      });
    }
  };

  ws.onclose = () => {
    ws = null;
    reconnectTimer = setTimeout(connect, 5000);
  };

  ws.onerror = () => {
    ws.close();
  };
}

function disconnect(clearCredentials = false) {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (clearCredentials) {
    currentUrl = null;
    currentToken = null;
    currentProfileId = null;
  }
  // Fail-fast: resolve any pending route callbacks instead of
  // letting them wait for their individual 5s timeouts.
  for (const [id, callback] of pendingRouteCallbacks) {
    callback({ error: "Not connected" });
  }
  pendingRouteCallbacks.clear();
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

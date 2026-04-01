// Offscreen document — holds the WebSocket connection alive
// (MV3 service workers sleep after ~30s, killing WebSocket connections)

let ws = null;
let reconnectTimer = null;
let currentUrl = null;
let currentToken = null;
let currentProfileId = null;
let pendingRouteCallback = null;

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
      ws.send(
        JSON.stringify({
          type: "route",
          url: msg.url,
          targetProfileId: msg.targetProfileId,
        })
      );
      const timeout = setTimeout(() => {
        pendingRouteCallback = null;
        sendResponse({ error: "Timeout" });
      }, 5000);
      pendingRouteCallback = (result) => {
        clearTimeout(timeout);
        pendingRouteCallback = null;
        sendResponse(result);
      };
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
      if (pendingRouteCallback) pendingRouteCallback({ ok: true });
    }

    if (msg.type === "open") {
      chrome.runtime.sendMessage({
        source: "offscreen",
        type: "open-url",
        url: msg.url,
      });
    }

    if (msg.type === "error") {
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
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

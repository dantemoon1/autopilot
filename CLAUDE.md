# autopilot

Browser extension that routes links between browser profiles automatically.

## Architecture

This is the **public repo** — contains the Chrome extension, native helper, and marketing website.

There is a companion **private repo** (`autopilot-server`) at `~/.superset/projects/autopilot-server` that handles auth, rules sync, WebSocket relay, and Stripe billing. Changes to the extension's server communication (API calls, WebSocket messages) must be coordinated with that repo.

## Structure

```
packages/
  extension/     Chrome extension (MV3, service worker)
  native-host/   Python native messaging host (local mode)
  website/       GitHub Pages site (dantemoon1.github.io/autopilot)
install.sh       Local installer (dev)
uninstall.sh     Uninstaller
```

## Two modes

- **Cloud mode**: user signs in with Google, rules stored on server, routing via WebSocket relay. Free tier gets 1 rule, premium gets unlimited.
- **Local mode**: native host installed via terminal, rules stored in `~/.local/share/autopilot/config.json`, unlimited rules, no server.

## Key files

- `extension/background.js` — service worker, handles both modes, OAuth, WebSocket relay, navigation interception
- `extension/config.js` — server URLs (switch between localhost and production here)
- `extension/popup.js` — UI logic, custom dropdowns, mode switching
- `extension/offscreen.js` — holds WebSocket connection alive (MV3 service workers sleep)
- `native-host/host.py` — native messaging bridge, has `HOST_VERSION` that must match `EXPECTED_HOST_VERSION` in background.js

## Conventions

- Browser icons are base64 PNGs extracted from macOS app bundles, not SVGs
- `parseSvg()` in popup.js uses `insertAdjacentHTML` (not DOMParser) for correct SVG namespace
- The extension ID is pinned via the `key` field in manifest.json: `eifgnohgbaefkgpgiipagieecnfjkome`
- External messaging from website pages uses `chrome.runtime.sendMessage(EXTENSION_ID, ...)` — requires `externally_connectable` in manifest

## Server API (for reference)

```
POST /auth/google          — exchange Google ID token for session JWT
GET  /profiles             — list user's profiles
POST /profiles             — create profile
DELETE /profiles/:id       — delete profile
GET  /rules                — list user's rules
POST /rules                — create rule (1 free, unlimited premium)
DELETE /rules/:id          — delete rule
GET  /subscription         — check subscription status
POST /checkout             — create Stripe checkout session
POST /billing              — create Stripe billing portal session
POST /webhooks/stripe      — Stripe webhook (signature-verified)
WebSocket /                — relay for real-time URL routing
```

## Testing

- Local dev: set `config.js` to `localhost:8080`, run server with `npm run dev`
- Production: set `config.js` to `https://autopilot-relay.fly.dev`
- Run `bash install.sh` to install the native helper for local mode testing

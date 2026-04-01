# autopilot — AI Agent Instructions

Browser extension that automatically routes links to the right browser or profile.

## Architecture

Two repos work together:

- **autopilot** (this repo, public) — Chrome extension, native helper, marketing website
- **autopilot-server** (private, `~/.superset/projects/autopilot-server`) — WebSocket relay, auth, Stripe billing

Changes to API calls, WebSocket messages, or CORS must be coordinated across both repos. Deploy server first when changing contracts.

## Structure

```
packages/
  extension/        Chrome extension (MV3, service worker)
    store/          Chrome Web Store assets
  native-host/      Python native messaging host (local mode)
  website/          Cloudflare Pages site (autopilotapp.co)
install.sh          Local installer
uninstall.sh        Uninstaller
```

## Key files

- `extension/background.js` — service worker: OAuth, WebSocket relay, navigation interception, context menu
- `extension/popup.js` — UI logic, custom dropdowns, mode switching
- `extension/offscreen.js` — persistent WebSocket connection (MV3 workers sleep), waits for server ack before confirming delivery
- `extension/config.js` — server URLs (localhost for dev, autopilot-relay.fly.dev for prod)
- `native-host/host.py` — native messaging bridge for local mode

## Important conventions

- Chrome Web Store extension ID: `cojhoeoiabkniahpnhobifbgpicfabpg`
- The extension ID must match in 3 places: `website/auth-callback.html`, `website/subscribe-success.html`, and server `ALLOWED_ORIGINS`
- Browser icons in popup.js are base64 PNGs from macOS app bundles, not SVGs
- `parseSvg()` uses `insertAdjacentHTML` (not DOMParser) for correct SVG namespace
- Offscreen document waits for server "routed" ack before returning success — do not change this to fire-and-forget
- Context menu must rebuild after: sign-in, profile rename, profile list, profile delete, reconnect

## Two modes

- **Cloud mode**: Google sign-in, server-synced rules, WebSocket relay. Free = 1 rule, Premium = up to 100.
- **Local mode**: native host, local JSON config, unlimited rules, no server.

## Server API

```
POST /auth/google          — exchange Google ID token for session JWT
GET  /profiles             — list profiles
POST /profiles             — create profile
PATCH /profiles/:id        — rename profile
DELETE /profiles/:id       — delete profile
GET  /rules                — list rules
POST /rules                — create rule
DELETE /rules/:id          — delete rule
GET  /subscription         — check subscription status
POST /checkout             — create Stripe checkout session
POST /billing              — create Stripe billing portal session
POST /webhooks/stripe      — Stripe webhook (signature-verified)
WebSocket /                — relay (sends "routed" on success, "error" on failure)
```

## Deployment

- **Website**: auto-deploys via Cloudflare Pages on push to main
- **Server**: `cd ~/.superset/projects/autopilot-server && fly deploy`
- **Extension**: bump version in manifest.json, zip `packages/extension/` excluding `store/`, upload to Chrome Web Store dashboard
- **Releases**: `git tag vX.Y.Z && git push origin vX.Y.Z`, then `gh release create` with the zip attached

## Git workflow

- This repo: push directly to main
- Server repo: PRs with code review before merging

## What not to do

- Do not add a `key` field to manifest.json — Chrome Web Store rejects it
- Do not store or log URLs on the server — they are relayed in-memory only
- Do not use DOMParser for SVGs in popup.js — it breaks namespaces
- Do not make offscreen route handler fire-and-forget — tabs will close even when target is offline
- Do not change the extension ID without updating auth-callback.html, subscribe-success.html, and server CORS

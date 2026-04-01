# autopilot

Browser extension that routes links between browser profiles automatically.

## Architecture

This is the **public repo** — contains the Chrome extension, native helper, and marketing website.

There is a companion **private repo** (`autopilot-server`) at `~/.superset/projects/autopilot-server` that handles auth, rules sync, WebSocket relay, and Stripe billing. Changes to the extension's server communication (API calls, WebSocket messages) must be coordinated with that repo.

## Structure

```
packages/
  extension/     Chrome extension (MV3, service worker)
    store/       Chrome Web Store assets (screenshots, promo images, zip)
  native-host/   Python native messaging host (local mode)
  website/       Cloudflare Pages site (autopilotapp.co)
install.sh       Local installer (dev)
uninstall.sh     Uninstaller
```

## Two modes

- **Cloud mode**: user signs in with Google, rules stored on server, routing via WebSocket relay. Free tier gets 1 rule, premium gets up to 100.
- **Local mode**: native host installed via terminal, rules stored in `~/.local/share/autopilot/config.json`, unlimited rules, no server.

## Key files

- `extension/background.js` — service worker, handles both modes, OAuth, WebSocket relay, navigation interception, context menu
- `extension/config.js` — server URLs (switch between localhost and production here)
- `extension/popup.js` — UI logic, custom dropdowns, mode switching
- `extension/offscreen.js` — holds WebSocket connection alive, waits for server route acknowledgment before confirming delivery
- `native-host/host.py` — native messaging bridge, has `HOST_VERSION` that must match `EXPECTED_HOST_VERSION` in background.js

## Conventions

- Browser icons are base64 PNGs extracted from macOS app bundles, not SVGs
- `parseSvg()` in popup.js uses `insertAdjacentHTML` (not DOMParser) for correct SVG namespace
- Chrome Web Store extension ID: `cojhoeoiabkniahpnhobifbgpicfabpg`
- External messaging from website pages uses `chrome.runtime.sendMessage(EXTENSION_ID, ...)` — requires `externally_connectable` in manifest
- The extension ID must match in three places: `auth-callback.html`, `subscribe-success.html`, and server `ALLOWED_ORIGINS`

## Server API (for reference)

```
POST /auth/google          — exchange Google ID token for session JWT
GET  /profiles             — list user's profiles
POST /profiles             — create profile
PATCH /profiles/:id        — rename profile
DELETE /profiles/:id       — delete profile
GET  /rules                — list user's rules
POST /rules                — create rule (1 free, up to 100 premium)
DELETE /rules/:id          — delete rule
GET  /subscription         — check subscription status
POST /checkout             — create Stripe checkout session
POST /billing              — create Stripe billing portal session
POST /webhooks/stripe      — Stripe webhook (signature-verified)
WebSocket /                — relay for real-time URL routing (sends "routed" ack on success)
```

## Deployment

- **Website**: Cloudflare Pages, auto-deploys from `packages/website/` on push to main
- **Server**: Fly.io, deploy manually with `cd ~/.superset/projects/autopilot-server && fly deploy`
- **Extension**: Upload `packages/extension/store/autopilot-extension.zip` to Chrome Web Store developer dashboard

## Releases

- Tag releases with `git tag vX.Y.Z && git push origin vX.Y.Z`
- Create GitHub release with `gh release create vX.Y.Z` and attach the extension zip
- Bump version in `manifest.json` before creating a new zip

## Git workflow

- Push directly to `main` — this is a public extension repo, no PR required
- The companion server repo uses PRs for code review before merging
- When changing WebSocket message types or API contracts, update both repos and deploy server first

## Testing

- Local dev: set `config.js` to `localhost:8080`, run server with `npm run dev`
- Production: set `config.js` to `https://autopilot-relay.fly.dev`
- Run `bash install.sh` to install the native helper for local mode testing

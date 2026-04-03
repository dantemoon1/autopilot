# autopilot

**Open links in the right browser, every time.**

You use different browsers for work and personal. But every link opens in whatever browser you clicked from. So you copy-paste URLs between windows, or just deal with everything being in the wrong place.

autopilot fixes that. Set a rule once, and links go where they belong, automatically.

[**Install from Chrome Web Store**](https://chromewebstore.google.com/detail/autopilot/cojhoeoiabkniahpnhobifbgpicfabpg?utm_source=github)

## How it works

- **Route by domain** — `github.com` goes to Work, `netflix.com` goes to Personal
- **Route by keyword** — catch tricky URLs like `aws`, `teams`, or `jira` redirects
- **Right-click any link** — send it to another browser on the spot
- **Works across computers** — click a link at home, it opens on your work laptop

### Supported browsers

Chrome, Brave, Edge, Arc, Helium. Route between any combination.

## Two ways to use it

### Cloud mode

Sign in with Google. Rules sync across browsers and computers. One free rule included, upgrade for more.

### Local mode (self-host)

Install the native helper for unlimited rules, no account needed:

```
curl -fsSL https://autopilotapp.co/install | bash
```

macOS only. Everything stays on your device.

## Uninstall

**Cloud mode:** Remove the extension from your browser. To delete your account and data, email dante142@gmail.com.

**Local mode:** Remove the extension, then run:

```
bash ~/.local/share/autopilot/uninstall.sh
```

Add `--purge` to remove saved rules too.

## Links

- [Website](https://autopilotapp.co)
- [Chrome Web Store](https://chromewebstore.google.com/detail/autopilot/cojhoeoiabkniahpnhobifbgpicfabpg?utm_source=github)
- [Privacy Policy](https://autopilotapp.co/privacy.html)
- [Terms of Service](https://autopilotapp.co/terms.html)
- [Report a bug](https://github.com/dantemoon1/autopilot/issues)

## License

MIT


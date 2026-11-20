# Installing Cairn as an app

The Cairn interface is a progressive web app. You can use it in a normal browser tab or install it so it opens in its own window.

## Installing

Browsers that support installation offer it from the address bar or the browser menu. Chromium-based browsers such as Chrome and Edge show an install option for pages served from `127.0.0.1` or `localhost`. Safari offers "Add to Dock" on macOS and "Add to Home Screen" on iOS. Support, wording and behavior differ between browsers and operating systems, and a browser decides whether installation is offered. An installer cannot force it.

Use the same address every time. Browsers treat `127.0.0.1` and `localhost` as different sites, and each one needs its own pairing.

## Offline behavior

Cairn keeps its interface files cached in the browser. When the runtime is not running, opening the app shows an explanation page instead of a browser error. Your library and saves live on your computer and are unaffected.

Pages that show your library are never stored in the browser cache.

## Troubleshooting

- If the install option is missing, reload the page once so the browser can read the manifest.
- If the app opens a pairing page, run `bun run open` to pair this browser again.
- After an update, the browser refreshes the cached interface files the next time it loads the app.

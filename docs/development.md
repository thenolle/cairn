# Development

## Requirements

Bun at the version listed in `.bun-version`.

## Setup

```bash
bun install
bun run check
```

`bun run check` generates the route manifests, type-checks the project, verifies required repository files and performs a full production build.

## Running

Development, with the interface rebuilt at startup and the runtime restarting on source changes:

```bash
bun run dev
```

Production build:

```bash
bun run build
bun run start
```

Open the interface in your default browser, with a one-time pairing code:

```bash
bun run open
```

## Project layout

| Path         | Contents                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| `src/server` | The runtime: configuration, database, security and HTTP server.                |
| `src/ui`     | The web interface: routes, components, styles and the service worker template. |
| `src/shared` | Types and constants used by both.                                              |
| `scripts`    | Build, generation and repository checks.                                       |
| `docs`       | Documentation and architecture decision records.                               |

Browser code never imports from `src/server`. Server-only route files end in `.server.ts` and may import types from the server.

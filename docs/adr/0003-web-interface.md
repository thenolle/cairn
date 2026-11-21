# 0003. Web interface

## Context

Cairn's interface is served by the local runtime and must be installable, usable offline and comfortable on desktop, touch and controller input.

## Decision

- The interface is built with Gambrel: file-based routes, server rendering and hydration.
- Styling is plain CSS built from design tokens. Dark is the default, and a light scheme follows the system setting.
- The shell uses a sidebar on wide screens and a bottom tab bar on narrow ones.
- Static assets, the manifest, the service worker and the offline page are public. They contain no user data.
- The service worker caches the shell assets and an offline page. Pages containing user data are never cached, and API requests bypass it.
- Icons are generated at build time so the repository contains no binary files.

## Consequences

- Pages work without client JavaScript and are enhanced by hydration.
- Cached assets are replaced when their content changes.
- Installation is offered by the browser and cannot be forced.

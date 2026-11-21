# 0011. Artwork provider

## Context

Discovered games have no pictures, so the interface falls back to tinted tiles. Artwork providers need keys, have terms of use and rate limits, and serve images from their own servers.

## Decision

- SteamGridDB is the first provider. Its key comes from the environment and is never stored or logged.
- Lookups are explicit: a button for one game and a bounded background run. There is no automatic bulk download.
- Requests are serialized and spaced. A rate-limit or key rejection stops a run.
- Games are matched by Steam id, then by exact or unique prefix name match. Uncertain matches are skipped.
- Images are downloaded only from the provider's hosts over HTTPS, with every redirect checked, a size limit and the same type validation as uploads. They go through the artwork service so storage rules stay in one place.
- Only missing artwork is filled.

## Consequences

- Descriptions and other metadata need another provider.
- Other providers can be added behind the same service.

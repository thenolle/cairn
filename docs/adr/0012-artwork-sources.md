# 0012. Artwork sources

## Context

One source cannot know every game. Sources differ in cost, keys, terms and the platforms they cover, and the interface needs more than a cover and a banner.

## Decision

- Artwork has four kinds: cover, banner, logo and icon.
- Sources implement one contract that lists offers. The service downloads, validates and stores them, so storage rules stay in one place.
- Sources are tried in order, local files first, then keyless online sources, then sources with keys. Each missing kind is filled by the first source that has it.
- A game is searched automatically after discovery, with a memory of recent attempts so the same games are not retried.
- Image downloads are restricted to each source's hosts over HTTPS, with every redirect checked, a size limit and byte-level type validation.
- Keys come from the environment and are never stored or logged. Only missing artwork is filled.

## Consequences

- Adding a source is one provider and one registration.
- Local Steam files depend on Steam's cache layout, so Cairn handles both known layouts and classifies unknown files by their shape.
- Descriptions and other metadata are not covered yet.

# 0004. Library data model

## Context

The library must stay responsive with thousands of entries and accept games from several sources.

## Decision

- Each game has a UUID. Games from external sources are also identified by `(source, source_id)`, which is unique when a source id exists.
- Names are stored with a normalized key used for sorting and searching.
- Lists use keyset pagination over `(name_key, id)` or `(created_at, id)`, with indexes matching each order.
- Search requires every word to appear in the normalized name.
- Platforms and sources are text values validated at the application boundary, so integrations can add values without schema changes.
- Install state is an explicit value, and `unknown` is the default for games Cairn has not verified.
- Changes are made through forms that post to action routes and redirect to a page.

## Consequences

- Deep pages cost the same as the first.
- Full-text search is not used. Search cost grows linearly with the number of games and is measured with the seed script.

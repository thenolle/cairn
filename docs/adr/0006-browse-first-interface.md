# 0006. Browse-first interface

## Context

The navigation rail suited a launcher with a few destinations, but Cairn is mostly about browsing a large collection by artwork. Streaming services have settled on patterns that people already know.

## Decision

- Navigation is a fixed top bar: wordmark, primary links, expanding search, an add button and the guest profile. It is transparent over a banner and solid after scrolling.
- Home leads with a full-bleed featured game and rows that overlap its lower edge: favorites, recent additions and one row per platform.
- Rows scroll horizontally and snap. Previous and next buttons are native buttons with accessible names and appear only when a row overflows.
- Cards grow on hover or focus and offer a quick favorite toggle. On devices without hover, the actions are always visible.
- Each game keeps its own page, so addresses work without script.
- The interface is dark. A light theme returns with theme customization.

This supersedes the navigation decisions in 0005. Artwork handling in 0005 is unchanged.

## Consequences

- Browsing needs no script. Scripts add arrows and the solid top bar.
- Rows are limited to twelve games. Longer lists continue in the library.

# 0005. Launcher interface and artwork

## Context

Cairn should feel like a game launcher: artwork-led, quick to scan and comfortable with mouse, touch and keyboard.

## Decision

- Navigation is a narrow icon rail with a marker on the active item. Favorites are pinned beneath the main items as cover tiles. On small screens the rail becomes a bottom tab bar.
- Home features one game with a large banner, then rows of favorites and recent additions.
- The library is a grid of covers with server-side search, filters and pagination.
- A game page puts the banner behind the title, with the poster, primary action and facts.
- Images are uploaded by the user and stored beside the database. Rows in the `artwork` table point to files, and a game's artwork is removed with the game.
- Games without artwork use a tinted tile with initials. Tint classes are fixed in the stylesheet because pages cannot use inline styles.

## Consequences

- Pages stay useful without artwork, and look better as artwork is added.
- Metadata providers can later write into the same table and folder.
- The interface does not offer a launch action until a platform integration can launch the game.

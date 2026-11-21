# Integrations

An integration is a source of games. Cairn only reads from integrations. It never changes a launcher's files.

The **Integrations** page lists each source, whether it was found, and exactly what Cairn can do with it. A capability is only marked as supported when it works. Scans run when Cairn starts and when you choose **Scan now**.

## Steam

Cairn finds Steam in its usual locations. On Windows it also reads the install folder Steam records in the registry. If Steam is installed elsewhere, set `CAIRN_STEAM_PATH` to its folder.

Cairn reads Steam's library list and the manifest of each installed game, across all your Steam library folders.

- New Steam games are added to your library as PC games.
- Installation state stays in sync with Steam. A game that Steam no longer lists is marked as not installed. It is not removed.
- Names are not overwritten, so changes you make by hand are kept.
- Steam's tools and compatibility layers, such as Proton and the Steam Linux Runtime, are left out.

Steam does not publish a supported way to read this data. Cairn reads the files Steam itself writes, so a future Steam update could change what is available. If a scan reports a problem, the Integrations page shows it.

Artwork and descriptions for Steam games are not provided by Steam's local files. Use a game's **Artwork** page to add images.

## Epic Games

On Windows, Cairn reads the manifest files the Epic Games Launcher writes for installed games. On other systems, set `CAIRN_EPIC_MANIFESTS` to the launcher's `Manifests` folder.

- Only installed games can be found. Games you own but have not installed are not visible without signing in to Epic, which Cairn does not do.
- New games are added as PC games. A game whose install folder no longer exists is marked as not installed, and a half-finished install is marked as unknown.
- Add-ons and expansions are not added as separate games.
- Names are not overwritten, so changes you make by hand are kept.

Epic does not publish a supported way to read this data, so a future launcher update could change what is available.

## Game folders

Add folders on the **Integrations** page, with the platform of the games inside. Cairn scans each folder and the folders within it, up to six levels deep, for these file types:

| Platform | File types |
| --- | --- |
| Nintendo Switch | `.nsp`, `.xci`, `.nsz`, `.xcz` |
| Nintendo 3DS | `.3ds`, `.cia`, `.cxi`, `.3dsx` |
| Nintendo DS | `.nds` |

- The title comes from the file name. Region and version tags such as `(USA)` and `[v1]` are removed. You can rename a game in Cairn, and the name is kept.
- Cairn never opens, changes or moves your files.
- Switch updates and DLC in the same folder appear as separate games. Remove any you do not want.
- A game whose file is gone is marked as not installed, not removed. Moving or renaming a file adds a new game. If a folder cannot be read, for example because a drive is disconnected, nothing is marked as missing.
- Removing a folder from Cairn does not delete its games. They are marked as not installed.
- Hidden files and folders, and shortcuts that point elsewhere, are skipped.

Launching these games needs an emulator integration, which is not available yet.

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

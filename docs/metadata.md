# Artwork from SteamGridDB

Cairn can fetch covers and banners for games that have none.

1. Create a free account on SteamGridDB and generate an API key in your preferences.
2. Set `CAIRN_STEAMGRIDDB_KEY` to the key and restart Cairn.
3. Choose **Fetch missing artwork** on the **Integrations** page, or **Find missing artwork** on a game's page.

How it works:

- Steam games are found by their Steam id. Other games are found by name, and Cairn only accepts an exact match, or a single result that starts with the game's name. Otherwise nothing is changed.
- Only missing covers and banners are filled. Artwork you uploaded is never replaced.
- Images flagged as adult, humorous or likely to trigger seizures are skipped, and only PNG, JPEG and WebP images are used.
- Cairn sends one request at a time with a pause between them. A run covers up to 40 games, so run it again to continue. It stops if SteamGridDB asks it to slow down.
- Banners from SteamGridDB are very wide, so the Home banner shows the middle part of them.

SteamGridDB allows personal, non-commercial use and is not affiliated with Valve. The key is read from the environment, is not stored in the library database and is never written to the log.

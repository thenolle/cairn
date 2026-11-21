# Artwork

Cairn finds four kinds of pictures for each game: a **cover**, a **banner**, a **logo** and an **icon**. The banner and logo appear on the Home billboard and the game's page, the cover on its page and in collections, and the logo over card thumbnails.

## Sources

Cairn tries these in order and keeps the first picture it finds for each kind.

| Source | Needs | Covers |
| --- | --- | --- |
| Steam image cache | Nothing | Steam games, read from the pictures Steam already stored on this computer. |
| Steam store images | Nothing | Steam games, from Steam's public image servers. |
| SteamGridDB | `CAIRN_STEAMGRIDDB_KEY` | Most games. Covers, banners, logos and icons. |
| IGDB | `CAIRN_IGDB_CLIENT_ID` and `CAIRN_IGDB_CLIENT_SECRET` | Games on every platform, including Switch, 3DS and DS games from folders. Covers and banners. |

To use SteamGridDB, create a free key in your account preferences. To use IGDB, register a free application at the Twitch developer console and use its client id and secret. Restart Cairn after setting them. SteamGridDB and IGDB allow personal, non-commercial use. SteamGridDB is not affiliated with Valve.

## How it works

- New games are searched automatically in the background after a scan finds them, and once at startup. A game that was tried recently is not tried again for a week. **Fetch missing artwork** on the Integrations page retries after an hour.
- Steam games are found by their Steam id. Other games are found by name, and Cairn only accepts an exact match, or a single result that starts with the game's name. Otherwise nothing is changed.
- Only missing pictures are filled. Pictures you set yourself are never replaced. You can also upload your own on a game's **Artwork** page.
- Images flagged as adult, humorous or likely to trigger seizures are skipped. Only PNG, JPEG and WebP images up to 8 MB are used, and each is checked by its contents.
- Cairn sends one request at a time to each online source with pauses between them. A run covers up to 40 games. It stops if a source rejects its key or asks it to slow down.
- Keys are read from the environment, are not stored in the library database and are never written to the log.

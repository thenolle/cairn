# Activity and playtime

Cairn notices when a game is running and records play sessions. It works for any game with a known install folder, whichever launcher started it, and does not depend on the launcher reporting anything.

- A game counts as running while a process runs from its install folder. Launchers live in their own folders, so a running launcher does not count.
- Checks happen every 10 seconds. A game must be missing for two checks in a row before its session ends, so starts and ends are accurate to roughly 10 seconds.
- Sessions shorter than 15 seconds are discarded. Longer ones add to the game's playtime and set its last played time.
- If Cairn restarts while a game is running, the session carries on.
- **Now playing** appears on the game's page, on its card and on the Home banner. When a session ends, an open game page refreshes so its playtime is current.
- Steam and Epic games are tracked from their install folders. Folder and ROM games are tracked once emulator launching is available.

Limits:

- Games whose real program lives outside their install folder are not detected.
- On Linux, Windows games run through Proton or Wine are detected from the `.exe` in the process arguments, on a best-effort basis.
- On macOS, `ps` shows an executable's full path only when it was started with one, which is normal for applications.
- Steam's own playtime history is not imported.

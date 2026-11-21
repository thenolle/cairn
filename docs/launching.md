# Launching games

Choose **Play** on a game from Steam or Epic Games. Cairn asks the launcher to start the game, and the launcher does the rest, including updates, sign-in and anti-cheat.

- Play only appears for installed games from a source that can launch. Games added by hand or from game folders cannot be started yet, because that needs an emulator integration.
- Cairn can ask for a launch but cannot see whether the game actually started, so it reports "Launch requested". It records when you last launched a game. Playtime is not tracked yet.
- Pressing Play twice within a few seconds is ignored.
- On Windows, Epic games are started using the launcher's own list of installations. If Cairn reports it cannot find what it needs, scan Epic Games again from the Integrations page.
- Steam and Epic must be installed and signed in. If Steam is closed, it starts first.

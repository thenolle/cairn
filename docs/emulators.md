# Emulators

Games found in game folders are started with an emulator you choose for each platform. Set them up on the **Integrations** page under **Emulators**.

For each platform, enter a name, the full path of the emulator's program, and its arguments.

- On Windows the program must be an `.exe` file. Batch files and scripts are refused.
- Arguments are separated by spaces. `{game}` is replaced by the game's file and must appear at least once. Quotes are not needed, because the file is always passed as a single argument.
- Cairn does not run a shell, so special characters in file names are safe.

Examples that match the emulators' own documentation:

| Emulator | Arguments |
| --- | --- |
| melonDS | `-f {game}` |
| Eden | `-f -g {game}` |

Other emulators accept different options. Run the emulator with `--help` and check before relying on a setup. Cairn can only tell whether the program started, not whether it accepted the arguments.

When you choose Play, Cairn starts the emulator with the game, and the game counts as running until the emulator exits. If Cairn stops while an emulator is running, a session carries on but cannot be followed any more and ends shortly after. On Windows, emulators started by Cairn also close when Cairn stops.

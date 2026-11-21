# 0008. Launching

## Context

Games must start without Cairn becoming a way to run arbitrary programs. Launchers already know how to start their own games and expose protocol links for it.

## Decision

- Adapters describe a launch as a plan and never start processes. The launch service validates the plan and performs it.
- Launch plans for Steam and Epic are links. Only two exact link shapes are accepted, with strictly validated identifiers. The system opener is not used for anything else, because it can also open files and programs.
- Processes are started with an argument array and never through a shell.
- Only installed games from adapters that declare launch support can be started. Repeated requests for one game are ignored for a few seconds.
- Success means the request was accepted, not that the game started. Playtime is not inferred from launch requests.

## Consequences

- Emulator launching will add a second kind of plan, with executables chosen by the user and arguments built from validated parts.
- Playtime tracking needs process or launcher session observation and is handled separately.

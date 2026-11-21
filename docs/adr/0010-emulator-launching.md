# 0010. Emulator launching

## Context

Emulators differ in command-line options, change often, and are chosen by the user. Cairn must start them without becoming a way to run arbitrary commands.

## Decision

- Each platform has one emulator profile: a name, an absolute program path and an argument template containing `{game}`.
- Profiles are checked when saved and the final launch plan is checked again when a game starts. On Windows only `.exe` files are accepted because batch files re-interpret their arguments.
- Arguments are built from separate tokens and the game's path is substituted into one argument. Processes are started from an argument array, never through a shell.
- Adapters describe a process launch as a plan. The launch service validates and starts it, then follows the started process so the session is recorded.
- Cairn does not detach emulators from itself.

## Consequences

- A wrong template fails when the emulator rejects it. Cairn only notices an immediate failure.
- Sessions for emulator games cannot be followed across a Cairn restart.

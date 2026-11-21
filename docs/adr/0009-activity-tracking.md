# 0009. Activity tracking

## Context

Playtime and "now playing" must work across launchers and operating systems and be managed by the local runtime. Launchers do not offer a supported local interface for session state.

## Decision

- The runtime periodically lists running processes and matches them against recorded install folders.
- Windows uses a fixed PowerShell command, Linux reads `/proc`, and macOS uses `ps`. Commands run without a shell.
- Only paths are compared. Command lines are never stored or logged.
- Sessions are stored in SQLite, resume across restarts, tolerate one missed check, and discard very short runs. Playtime is credited when a session ends.
- A failed process listing never starts or ends a session.
- The browser polls a protected endpoint to show running games.

## Consequences

- Detection depends on the install folder, so adapters must record it.
- Accuracy is limited by the check interval.
- Emulator launches will be tracked by the process Cairn starts.

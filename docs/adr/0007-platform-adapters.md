# 0007. Platform adapters

## Context

Games come from launchers, emulators and folders that expose very different capabilities. Cairn must not promise what a source cannot do.

## Decision

- Every source is a platform adapter with an identifier, a name, a declaration of each capability, a detection step and a discovery step.
- A capability is either supported or unsupported with a reason. Adapters never claim a capability they do not implement.
- Adapters read only. They never modify the source.
- Discovered games are synchronized by `(source, source id)`. New games are added, install state is updated, names are never overwritten and nothing is deleted.
- Games missing from a complete scan are marked as not installed. Scans that report warnings never mark games as missing.
- Where a source has no official interface, the adapter reads the files the launcher writes, with size and depth limits, and documents the limitation.

## Consequences

- Adding a source means writing one adapter and registering it.
- Launching, installing and save handling are added per adapter as they are implemented.

# 0001. Project structure and dependency policy

## Context

Cairn is a local-first application made of a background runtime and a web interface served by it. Contributors need clear boundaries and a small, auditable dependency surface.

## Decision

- Cairn is a single package. Domain boundaries are folders under `src/`, not separate packages.
- `src/shared` holds contracts and types used by both the runtime and the interface. It contains no server-only code.
- `src/server` holds everything privileged: database, filesystem, process execution, networking and configuration. It is never imported from `src/ui`.
- `src/ui` holds the interface, built with Gambrel.
- Runtime dependencies are limited to Gambrel packages and Bun's built-in APIs.
- Development dependencies are limited to `typescript` and `@types/bun`.
- Dependency versions are pinned exactly and the lockfile is committed. Continuous integration installs with a frozen lockfile.
- Any additional dependency requires a written justification in a new decision record.

## Consequences

- The dependency surface stays small enough to review in full.
- Capabilities not covered by Bun or Gambrel are implemented in the repository or documented as limitations.
- A future separately deployed service can be extracted into its own package when it has its own release cycle.

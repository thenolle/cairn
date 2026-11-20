# Contributing to Cairn

Thank you for your interest in Cairn.

## Licensing of contributions

Cairn is released under the PolyForm Strict License 1.0.0, which does not permit distributing or modifying the software. By submitting a contribution you confirm that you wrote it or have the right to submit it, and you agree that the project owner may include it in Cairn under the project's license.

## Before you start

- Check existing issues and pull requests.
- Open an issue before starting a substantial change.
- Keep pull requests focused. Avoid unrelated formatting or structural changes.
- Do not add dependencies without a clear technical reason. Runtime and development dependencies are limited to Bun, TypeScript tooling approved by the maintainer and Gambrel packages.

## Development setup

```bash
git clone https://github.com/thenolle/cairn.git
cd cairn
bun install
```

The required Bun version is listed in `.bun-version`.

## Quality checks

Run before submitting:

```bash
bun run check
```

## Code conventions

- TypeScript strict mode. No `any`, `@ts-ignore` or unchecked assertions.
- Explicit types at public boundaries.
- Prefer native Bun and Web APIs.
- Keep modules small and single-purpose.
- Server-only code such as the database, filesystem and process execution must never be imported from browser code.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat(library): add collection filters`.

`master` is protected. Open a pull request from a branch. Pull requests are squash-merged, need the `verify` check to pass and need all conversations resolved.

A pull request should explain the problem, describe the solution, link related issues and list how it was verified.

## Reporting bugs

Use the bug report template. Include reproduction steps, expected and actual behavior, and your environment.

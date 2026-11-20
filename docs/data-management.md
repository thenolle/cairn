# Data management

Cairn keeps your library state in a single SQLite database stored in the data directory described in [Configuration](configuration.md):

```text
<data directory>/cairn.sqlite
<data directory>/backups/
```

## Schema upgrades

When a new version of Cairn changes the database layout, the change is applied automatically at startup, inside a transaction. Before upgrading an existing database, Cairn writes a backup named `cairn-pre-migration-<timestamp>.sqlite` and keeps the five most recent.

Cairn refuses to start if the database was created by a newer version, or if its recorded history does not match the installed version. Nothing is modified in that case.

## Backups

List backups:

```bash
bun run database list
```

Create a backup. This is safe while Cairn is running:

```bash
bun run database backup
```

Backups are consistent copies of the whole database. Copy them to another disk to protect against drive failure.

## Restoring a backup

Stop Cairn, then run:

```bash
bun run database restore <file>
```

The current database is not deleted. It is renamed next to the restored one with a `.before-restore-<timestamp>` suffix, so a restore can be undone by renaming the files back.

## Integrity checks

Cairn checks the database for corruption each time it starts. If the check fails, Cairn stops with instructions instead of running on damaged data.

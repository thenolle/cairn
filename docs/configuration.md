# Configuration

Cairn reads its startup configuration from environment variables. Everything else is stored in the local database and edited from the interface.

## Environment variables

| Variable          | Default     | Description                                                                                               |
| ----------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `CAIRN_HOST`      | `127.0.0.1` | Address the runtime listens on. Only loopback addresses are accepted: `127.0.0.1`, `::1` and `localhost`. |
| `CAIRN_PORT`      | `17420`     | Port the runtime listens on. An integer from 1024 to 65535.                                               |
| `CAIRN_LOG_LEVEL` | `info`      | Minimum log level: `debug`, `info`, `warn` or `error`.                                                    |
| `CAIRN_HOME`      | unset       | Absolute path. When set, every Cairn directory is placed under it.                                        |

Invalid values stop the runtime at startup with a message naming the variable.

## Where Cairn stores files

| Platform | Config, data and state                                                    | Cache                        |
| -------- | ------------------------------------------------------------------------- | ---------------------------- |
| Windows  | `%LOCALAPPDATA%\Cairn`                                                    | `%LOCALAPPDATA%\Cairn\cache` |
| macOS    | `~/Library/Application Support/Cairn`                                     | `~/Library/Caches/Cairn`     |
| Linux    | `$XDG_CONFIG_HOME/cairn`, `$XDG_DATA_HOME/cairn`, `$XDG_STATE_HOME/cairn` | `$XDG_CACHE_HOME/cairn`      |

On Linux, each XDG variable falls back to `~/.config`, `~/.local/share`, `~/.local/state` and `~/.cache` when it is unset, empty or not an absolute path.

Logs are written to `state/logs/cairn.log`. The file rotates at 5 MB and the three most recent rotated files are kept. Secrets such as tokens and passwords are masked before anything is written.

## Portable and development setups

Set `CAIRN_HOME` to keep all files in one folder:

```bash
CAIRN_HOME=/path/to/cairn-data bun run start
```

## Opening the interface

The runtime only accepts requests from browsers that have been paired with it. Starting the runtime writes a short-lived, single-use pairing code to `state/pairing.json`. The launcher reads it and opens the interface in your default browser:

```bash
bun run open
```

The browser shows a confirmation page, and pairing completes when you select **Pair this browser**.

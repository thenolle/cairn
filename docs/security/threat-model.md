# Threat model

Cairn runs a local HTTP service that can read game files and start programs. This document describes what that service protects, who it defends against and where its limits are.

## Assets

- The game library, saves and settings stored on the computer.
- The ability to launch programs.
- Browser sessions that are allowed to use the runtime.
- Credentials and encryption keys used for optional cloud features.

## Trust boundary

The runtime trusts code running as the current operating-system user, since that code can already read the same files. It does not trust web pages, other users on the computer or other machines on the network.

## Threats and mitigations

| Threat                                              | Mitigation                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Another machine reaches the runtime                 | The runtime only binds to loopback addresses. Other values are rejected at startup.                                                                                            |
| A website calls the runtime from the user's browser | Session cookies are `SameSite=Strict` and `HttpOnly`. State-changing requests must be same-origin, and cross-site requests are refused.                                        |
| DNS rebinding                                       | Requests are accepted only for the host names `localhost`, `127.0.0.1` and `[::1]`.                                                                                            |
| Unauthenticated use of the API                      | Every route except the health check and the pairing page requires a paired session.                                                                                            |
| Guessing a pairing code or session                  | Codes and sessions come from the operating system's secure random source. Pairing codes are single-use and expire after ten minutes. Failed pairing attempts are rate limited. |
| Theft of stored sessions                            | Only SHA-256 hashes of session tokens are kept.                                                                                                                                |
| Pairing links consumed by scanners or prefetching   | A link only displays a confirmation page. The code is consumed by a `POST`.                                                                                                    |
| Secrets in logs                                     | Sensitive field names are masked, request logs omit query strings and pairing codes are never logged.                                                                          |
| Framing and content injection                       | Responses carry a strict content security policy, `X-Frame-Options: DENY` and `nosniff`.                                                                                       |

## Known limitations

- The runtime listens over plain HTTP on the loopback interface. Traffic never leaves the computer.
- Any process running as the same user can read the pairing code file and pair itself. This matches the privileges such a process already has.
- Browser sessions are stored as hashes in the local database. They survive restarts and can be revoked.
- All requests arrive from the same loopback address, so rate limiting applies to pairing attempts rather than to general traffic.
- The interface's static files, web app manifest, service worker script and offline page are served without a session so the pairing page and the installed app can load. They contain no user data.

## Uploaded images

| Threat | Mitigation |
| --- | --- |
| A file disguised as an image | The type is read from the file's first bytes. Only PNG, JPEG and WebP are stored, and the type claimed by the browser is ignored. |
| Scripts inside images | SVG is not accepted. Images are served with their detected type, `nosniff` and a policy that forbids scripts. |
| Path traversal | Files are written to a folder named after the game's identifier, with a name made from the image kind and detected type. Request paths are never used to locate files. |
| Oversized uploads | The request size must be declared and is limited to 8 MB plus form overhead before the body is read. |
| Reading images without a session | Images are served only to paired browsers. |

## Reading launcher data

| Threat | Mitigation |
| --- | --- |
| Crafted launcher files | Files are size limited, nesting is limited and malformed files are skipped with a warning. File names must match the expected pattern. |
| Reading outside a library | Only `.acf` manifests named `appmanifest_<number>.acf` are read, from a library's `steamapps` folder. |
| Running commands from launcher data | Nothing from these files is executed. The only process started during detection is a registry query with fixed arguments. |
| Modifying a launcher | Adapters only read. |

| Threat | Mitigation |
| --- | --- |
| Crafted Epic manifests | Only `.item` files up to 1 MB are parsed. Identifiers must match a strict pattern, names are cleaned, and malformed files are skipped with a warning. |
| Reading an install folder | The install location is only checked for existence. Nothing in it is read or run. |

## Game folders

| Threat | Mitigation |
| --- | --- |
| Scanning an unintended location | Folders are added by the paired local user only. Paths must be absolute, exist, and be folders. |
| Endless or huge scans | Depth, entries and games are limited per scan. Symbolic links and hidden entries are skipped, so loops cannot occur. |
| Reading file contents | Files are never opened. Only names and types are used. |
| A disconnected drive hiding games | A scan with any unreadable folder never marks games as missing. |

## Collections

| Threat | Mitigation |
| --- | --- |
| Crafted identifiers or names | Identifiers must match the expected format. Names are cleaned, limited in length and stored through parameterized queries. |
| Redirects after an action | The return address is the page that sent the request, accepted only when it is on the same host and not a network-path address. |

## Launching

| Threat | Mitigation |
| --- | --- |
| Opening arbitrary files or programs through the system opener | Only two exact link shapes are accepted, with identifiers limited to letters, digits, dots, underscores and dashes. Everything else is refused. |
| Command injection | No shell is used. The command is an argument array and the link cannot start with a dash. |
| Launch spam | Repeated requests for the same game within three seconds are ignored. |
| Launching from a page on the web | Launch is a form action protected by the same session and origin checks as every other action. |

## Activity tracking

| Threat | Mitigation |
| --- | --- |
| Exposing what you play | The activity endpoint is behind the same pairing, host and origin checks as every other route. |
| Exposing process details | Only executable paths are compared in memory. Arguments are not stored or logged. |
| Command injection | The PowerShell script is fixed text, and other commands take no input. No shell is used. |
| Resource use | One check runs at a time, with a 10 second timeout, and nothing runs when there are no installed games with a known folder. |

## Emulators

| Threat | Mitigation |
| --- | --- |
| Running arbitrary programs | Only a program you choose, on a platform you configured, is started, and only for games Cairn found. Windows accepts `.exe` files only, and script and batch extensions are refused. |
| Argument injection through file names | The game's path is substituted into one argument. No shell is used. Templates are limited to spaces, `{game}` and no other braces. |
| Escaping the game folder | A game's relative path may not contain empty, `.` or `..` parts, and its file type must match the platform. |
| Changing settings from the web | Emulator settings are form actions behind the same pairing, host and origin checks as every other action. |

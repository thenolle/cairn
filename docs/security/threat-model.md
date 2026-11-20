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

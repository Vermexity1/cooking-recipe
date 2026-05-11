# Architecture

## Request flow

1. The user authenticates through the web application.
2. The API validates the JWT, rate limits the request, and creates a browser session record.
3. The session broker places work on a regional Redis queue.
4. A worker node starts a Docker-isolated Chromium container with a dedicated storage directory.
5. The stream relay negotiates WebRTC for frames and input events, with a WebSocket delta-frame fallback.
6. Lifecycle events are written to audit logs and session state is synced to PostgreSQL.
7. Cleanup jobs destroy temporary storage and drain the worker after timeout or user action.

## Isolation model

- One container per browser session.
- Separate user namespace, process namespace, filesystem, and cookie partition.
- CPU, memory, network, and file descriptor quotas.
- No host mounts except an ephemeral scratch volume and explicit upload/download exchange.
- Browser permission prompts are mediated by the control plane.

## Security baseline

- HTTPS only, HSTS, CSP, strict referrer policy, and frame denial.
- JWT rotation with signed WebSocket session tickets.
- CSRF protection for browser-origin mutations.
- Input validation with Zod at every public boundary.
- Audit events for session create, stream attach, permission decisions, downloads, and cleanup.
- Abuse detection on session churn, outbound request patterns, and resource spikes.

# Veil Cloud Browser Platform

Veil is a privacy-focused cloud browser platform prototype. The web app presents a polished remote-browser workspace, while the backend, worker, shared packages, and infrastructure folders define the production architecture for isolated Chromium sessions streamed to users.

## What is included

- `apps/web`: Next.js App Router UI with tabs, URL bar, session controls, privacy dashboard, admin telemetry, command palette, and mock remote stream surface.
- `apps/api`: Fastify control plane skeleton for auth-ready session orchestration, WebSocket handoff, bookmarks, health checks, and rate limiting.
- `apps/worker`: Playwright Chromium worker skeleton designed to run inside locked-down disposable containers.
- `packages/types`: Shared TypeScript contracts for sessions, tabs, stream messages, audit events, and permissions.
- `packages/streaming`: Stream/input protocol helpers for WebRTC plus WebSocket fallback integration.
- `packages/config`: Security headers and container policy defaults.
- `infrastructure`: Docker Compose, Kubernetes manifests, and Terraform starter files.

## Local web app

```bash
npm --prefix apps/web run dev
```

Then open `http://localhost:3000`.

## Auth backend and Vercel hosting

The web app now supports backend-backed private beta accounts:

- Invite keys are stored as SHA-256 hashes.
- Usernames and emails are unique.
- Passwords are salted and hashed with Node `scrypt`; plaintext passwords are never stored.
- Local development falls back to `apps/web/private/*.json`.
- Vercel production requires `DATABASE_URL` so account data persists.

Recommended Vercel setup:

1. Create a Vercel project with Root Directory set to `apps/web`.
2. Add a Neon Postgres store from the Vercel Marketplace.
3. Add `DATABASE_URL` to the project environment if it was not injected automatically.
4. Seed invite keys into Neon:

```powershell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST/neondb?sslmode=require"
npm run seed:auth
```

5. Deploy:

```powershell
npm i -g vercel
vercel --cwd apps/web
vercel --cwd apps/web --prod
```

## Production direction

The browser worker is intentionally a legitimate remote browsing foundation: it isolates sessions, avoids credential interception, logs auditable lifecycle events, and models secure cleanup. Real deployment should add hardened container profiles, a TURN service, persistent PostgreSQL/Redis, signed WebRTC offers, observability, and abuse controls before public access.

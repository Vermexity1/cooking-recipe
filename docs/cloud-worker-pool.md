# Free cloud worker pool

The web app can route remote-browser sessions to already-deployed Chromium
workers before falling back to the included Vercel Sandbox quota.

## Environment variables

Set any of these on the Vercel project:

```env
VM_WORKER_AUTH_TOKEN=
RENDER_VM_WORKER_URL=
KOYEB_VM_WORKER_URL=
VM_WORKER_URL=
VM_WORKER_URL_1=
VM_WORKER_URL_2=
VM_WORKER_URL_3=
VM_WORKER_URL_4=
VM_WORKER_URL_5=
VM_WORKER_URLS=
```

`VM_WORKER_URLS` accepts comma-separated or newline-separated URLs. Use it only
for free worker URLs you control.

`/api/vm/launch` health-checks the configured workers, picks the fastest healthy
one, returns the rest as browser-side backups, then falls back to Vercel Sandbox
only if no worker answers.

## Free provider order

1. Render Free Web Service: easiest free Docker worker, but it sleeps after idle
   time and has monthly limits.
2. Koyeb Free Instance: one free Web Service with 512 MB RAM, 0.1 vCPU, and 2 GB
   SSD. It scales down to zero after 1 hour without traffic. This may be too
   small for Chromium-heavy pages, but it is worth trying as a backup worker.
3. Vercel Sandbox fallback: included with Vercel Hobby usage caps; if the cap is
   exhausted, the cloud runner will fail instead of becoming unlimited.

Fly.io is not listed because current Fly.io docs say there is no free account or
free tier for new users. Legacy free allowances only apply to older accounts.
Oracle setup files were removed because capacity/sign-up was not working for this
project.

## Worker environment

Use these variables on each worker service:

```env
INITIAL_URL=https://www.wikipedia.org
MAX_FPS=3
FRAME_QUALITY=52
SCRATCH_ROOT=/tmp/veil-sessions
WORKER_AUTH_TOKEN=make-this-a-long-random-secret
```

Put the same secret on Vercel:

```env
VM_WORKER_AUTH_TOKEN=the-same-long-random-token-you-put-on-the-worker
```

If `WORKER_AUTH_TOKEN` is set on the worker, direct requests to `/health`,
`/frame.jpg`, and input endpoints are rejected unless Vercel adds the matching
token. This does not make a public worker URL private, but it prevents casual
unauthorized use of the worker URL.

## Bandwidth controls

The cloud runner no longer streams a JPEG every 150 ms forever.

- Adaptive mode: 6 FPS burst, JPEG quality 72.
- Low data mode: 4 FPS burst, JPEG quality 58.
- Battery saver: 3 FPS burst, JPEG quality 52.
- Idle tabs slow to 600 ms, 1200 ms, then 4000 ms between frames.
- Hidden tabs pause almost completely.
- Frames are generated on demand and sent with `cache-control: no-store`.

## Storage policy

Runtime screenshots, browser process memory, and streamed frames are disposable.
They should not be stored in Postgres, object storage, or Vercel Blob.

Persist only account data, invite claims, bookmarks, and optional user settings.
For temporary sessions, cookies/cache should live in a worker-local scratch
directory and be deleted on session close or process shutdown.

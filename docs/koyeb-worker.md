# Koyeb worker setup

Koyeb has one free Web Service instance per organization. The free instance is
small, so treat it as a backup cloud runner instead of the main high-performance
browser worker.

## Koyeb variables

Set these on the Koyeb service:

```env
INITIAL_URL=https://www.wikipedia.org
MAX_FPS=3
FRAME_QUALITY=52
SCRATCH_ROOT=/tmp/veil-sessions
WORKER_AUTH_TOKEN=paste-the-same-secret-as-vercel
```

Set this on Vercel after Koyeb gives you a public URL:

```env
KOYEB_VM_WORKER_URL=https://your-koyeb-app.koyeb.app
VM_WORKER_AUTH_TOKEN=paste-the-same-secret-as-koyeb
```

## Deploy settings

- Repository: `Vermexity1/cooking-recipe`
- Branch: `main`
- Root directory: `apps/worker`
- Builder: Dockerfile
- Dockerfile path: `Dockerfile`
- Instance type: `free`
- Region: Washington, D.C. or Frankfurt
- HTTP port: use the app's `PORT` environment variable

After deploying, open:

```text
https://your-koyeb-app.koyeb.app/health
```

If the response shows `ok: true`, redeploy the Vercel web app and check:

```text
https://velvet-pantry.vercel.app/api/cloud/providers
```

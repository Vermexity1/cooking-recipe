# Oracle Always Free worker setup

This deploys the remote Chromium worker on an Oracle Cloud Always Free VM and
connects it back to the Vercel web app with `OCI_VM_WORKER_URL`.

## What this uses

- Oracle `VM.Standard.A1.Flex` Ampere ARM VM.
- Docker and Docker Compose.
- `apps/worker/Dockerfile.oracle`, which uses Debian system Chromium for ARM.
- Caddy for automatic HTTPS.
- `sslip.io` for a free hostname that points at the VM public IP.

## Safe free settings

Stay inside Oracle's Always Free limits:

- Shape: `VM.Standard.A1.Flex`
- OCPU: `1`
- Memory: `6 GB`
- Boot volume: `50 GB`

If A1 capacity is unavailable in your region, stop and try again later. Do not
pick a paid shape.

## VM setup commands

After the Oracle VM is created and ports `80` and `443` are open, SSH into it
and run:

```bash
export WORKER_AUTH_TOKEN='paste-the-same-token-used-by-VM_WORKER_AUTH_TOKEN'
curl -fsSL https://raw.githubusercontent.com/Vermexity1/cooking-recipe/main/infrastructure/oracle/setup-worker.sh | bash
```

The script prints a URL like:

```text
https://123.45.67.89.sslip.io
```

Add that to Vercel as:

```env
OCI_VM_WORKER_URL=https://123.45.67.89.sslip.io
```

Keep the existing Vercel `VM_WORKER_AUTH_TOKEN` value the same as the Oracle
`WORKER_AUTH_TOKEN`.

## Health checks

From your computer:

```bash
curl https://123.45.67.89.sslip.io/health
```

From the VM:

```bash
cd ~/cooking-recipe
sudo docker compose -f infrastructure/oracle/docker-compose.yml ps
sudo docker compose -f infrastructure/oracle/docker-compose.yml logs -f worker
```

## Updating later

SSH into the VM and run:

```bash
cd ~/cooking-recipe
git pull --ff-only
sudo env ORACLE_WORKER_HOST="$(curl -fsS https://api.ipify.org).sslip.io" \
  docker compose -f infrastructure/oracle/docker-compose.yml up -d --build
```

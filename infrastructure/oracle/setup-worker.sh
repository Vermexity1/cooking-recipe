#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${WORKER_AUTH_TOKEN:-}" ]]; then
  echo "Set WORKER_AUTH_TOKEN first."
  echo "Example: export WORKER_AUTH_TOKEN='paste-the-same-secret-you-use-on-vercel'"
  exit 1
fi

REPO_URL="${REPO_URL:-https://github.com/Vermexity1/cooking-recipe.git}"
REPO_DIR="${REPO_DIR:-$HOME/cooking-recipe}"
PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS https://api.ipify.org)}"
ORACLE_WORKER_HOST="${ORACLE_WORKER_HOST:-$PUBLIC_IP.sslip.io}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl git docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

if [[ ! -d "$REPO_DIR/.git" ]]; then
  rm -rf "$REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
else
  git -C "$REPO_DIR" pull --ff-only
fi

cd "$REPO_DIR"

cat > infrastructure/oracle/worker.env <<EOF
PORT=3000
INITIAL_URL=https://www.wikipedia.org
MAX_FPS=${MAX_FPS:-4}
FRAME_QUALITY=${FRAME_QUALITY:-58}
SCRATCH_ROOT=/tmp/veil-sessions
WORKER_AUTH_TOKEN=$WORKER_AUTH_TOKEN
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
EOF

sudo env ORACLE_WORKER_HOST="$ORACLE_WORKER_HOST" \
  docker compose -f infrastructure/oracle/docker-compose.yml up -d --build

echo ""
echo "Oracle worker is starting."
echo "Public worker URL: https://$ORACLE_WORKER_HOST"
echo ""
echo "Test it with:"
echo "curl https://$ORACLE_WORKER_HOST/health"
echo ""
echo "Add this to Vercel when health shows ok:true:"
echo "OCI_VM_WORKER_URL=https://$ORACLE_WORKER_HOST"

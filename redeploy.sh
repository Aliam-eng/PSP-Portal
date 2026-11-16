#!/usr/bin/env bash
# Pull the latest code and redeploy in one step.
#
#   ./redeploy.sh                      # pull + deploy deposit.giv.trade (Caddy)
#   ./redeploy.sh portal.giv.trade     # pull + deploy another domain
#   ./redeploy.sh portal.giv.trade --behind-proxy --port=8090
#
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${1:-deposit.giv.trade}"
[ $# -gt 0 ] && shift || true

echo "==> Pulling latest from git ..."
git pull --ff-only

echo "==> Deploying $DOMAIN ..."
./deploy.sh "$DOMAIN" "$@"

echo
echo "==> Running containers:"
COMPOSE="docker-compose.prod.yml"
for a in "$@"; do case "$a" in --behind-proxy|--proxied) COMPOSE="docker-compose.proxied.yml";; esac; done
docker compose -f "$COMPOSE" ps

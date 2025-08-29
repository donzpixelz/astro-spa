#!/usr/bin/env bash
# deploy-local.sh — Local → EC2 (SSH) deploy for astro-spa (single app)
# - Commit/push to GitHub (respects .gitignore) with [skip ci]
# - Mirror ENTIRE project → /opt/astro-spa/repo (reference copy)
# - Build Astro locally: app/astro → app/astro/dist
# - Sync ONLY built site (dist/) → /usr/share/nginx/html  (**with --delete**)
# - Sync nginx/ → /etc/nginx/conf.d (backup → test → reload; rollback on failure)
# - No S3, no SSM. SSH only. Returns to prompt.

set -Eeuo pipefail

# ---- EDITABLE (for now) -------------------------------------------------------
SSH_KEY="${SSH_KEY:-$HOME/.ssh/aws-ssh-key}"   # your private key created earlier
EC2_IP="${EC2_IP:-18.220.33.0}"                # TEMP; replace when your new EC2 is up
# -------------------------------------------------------------------------------

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REMOTE_REPO="/opt/astro-spa/repo"
DOCROOT="/usr/share/nginx/html"
CONF_DIR="/etc/nginx/conf.d"

APP_DIR="$PROJECT_ROOT/app/astro"
BUILD_DIR="$APP_DIR/dist"
NGINX_DIR="$PROJECT_ROOT/nginx"

# Commit message (keeps CI off for this local-only deploy path)
MSG="${1:-site: local SSH deploy [skip ci]}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

# 0) Quick sanity
[ -f "$SSH_KEY" ] || { echo "❌ SSH key not found: $SSH_KEY"; exit 1; }
[ -n "$EC2_IP" ]  || { echo "❌ EC2_IP is empty"; exit 1; }
[ -d "$APP_DIR" ] || { echo "❌ app/astro not found at: $APP_DIR"; exit 1; }

# 1) Push to GitHub (respects .gitignore)
git add -A || true
if ! git diff --cached --quiet; then
  git commit -m "$MSG" || true
fi
git push origin "$BRANCH" || true

# 2) Local build (Astro) → app/astro/dist
echo "==> Building Astro locally: $APP_DIR → $BUILD_DIR"
pushd "$APP_DIR" >/dev/null
if [ -f package-lock.json ]; then
  npm ci
elif [ -f pnpm-lock.yaml ]; then
  command -v pnpm >/dev/null 2>&1 || npm i -g pnpm
  pnpm i
else
  npm install
fi
npx astro build
popd >/dev/null

[ -d "$BUILD_DIR" ] || { echo "❌ Build did not produce $BUILD_DIR"; exit 1; }

# 3) Ensure remote tools & dirs
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" 'bash -se' <<'SSH'
set -Eeuo pipefail
# Ensure rsync exists
if ! command -v rsync >/dev/null 2>&1; then
  if command -v yum >/dev/null 2>&1; then sudo yum install -y -q rsync >/dev/null
  elif command -v dnf >/dev/null 2>&1; then sudo dnf install -y -q rsync >/dev/null
  elif command -v apt-get >/dev/null 2>&1; then sudo apt-get update -y >/dev/null && sudo apt-get install -y -q rsync >/dev/null
  fi
fi
sudo mkdir -p /opt/astro-spa/repo /usr/share/nginx/html /etc/nginx/conf.d
SSH

RSYNC_SSH=( -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" --rsync-path="sudo rsync" )
FILTER=( --filter=':- .gitignore' )
EXCLUDES=( --exclude ".git/" --exclude ".git/**" --exclude ".DS_Store" )

# 4) Mirror ENTIRE project → remote reference dir (OK to --delete)
echo "==> Mirroring repo to $REMOTE_REPO (reference)"
rsync -az --delete "${FILTER[@]}" "${EXCLUDES[@]}" "${RSYNC_SSH[@]}" \
  "$PROJECT_ROOT"/ ec2-user@"$EC2_IP":"$REMOTE_REPO"/

# 5) Deploy built site (dist/) → docroot (**with --delete** to avoid stale files)
echo "==> Deploying built site to $DOCROOT (with --delete)"
rsync -az --delete "${RSYNC_SSH[@]}" \
  "$BUILD_DIR"/ ec2-user@"$EC2_IP":"$DOCROOT"/

# 6) Safe sync nginx/ → conf.d (backup → test → reload; rollback on failure)
if [ -d "$NGINX_DIR" ]; then
  echo "==> Syncing nginx/ confs safely"
  # (a) Remote backup BEFORE sync
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" 'bash -se' <<'SSH'
set -Eeuo pipefail
CONF_DIR="/etc/nginx/conf.d"
TS="$(date +%Y%m%d-%H%M%S)"
BAK_DIR="/etc/nginx/conf.d.bak-${TS}"
sudo mkdir -p "$BAK_DIR"
sudo rsync -a --delete "$CONF_DIR"/ "$BAK_DIR"/
echo "$BAK_DIR" | sudo tee /tmp/last_conf_backup >/dev/null
SSH

  # (b) Ship YOUR nginx/ AS-IS (we DO allow delete so confs stay in sync)
  rsync -az --delete "${EXCLUDES[@]}" "${RSYNC_SSH[@]}" \
    "$NGINX_DIR"/ ec2-user@"$EC2_IP":"$CONF_DIR"/

  # (c) Test & reload; rollback if test fails
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" 'bash -se' <<'SSH'
set -Eeuo pipefail
CONF_DIR="/etc/nginx/conf.d"
BIN="/usr/sbin/nginx"; command -v "$BIN" >/dev/null 2>&1 || BIN="$(command -v nginx || true)"
BAK_DIR="$(sudo cat /tmp/last_conf_backup 2>/dev/null || true)"
if [ -z "$BIN" ]; then echo "❌ nginx not found on remote"; exit 1; fi

if ! sudo "$BIN" -t; then
  echo "⚠️  nginx -t failed — rolling back conf.d"
  if [ -n "$BAK_DIR" ] && [ -d "$BAK_DIR" ]; then
    sudo rsync -a --delete "$BAK_DIR"/ "$CONF_DIR"/
    sudo "$BIN" -t || true
  fi
  exit 1
fi

sudo systemctl reload nginx || sudo "$BIN" -s reload || true
echo "nginx reloaded (config OK)"
SSH
fi

# 7) Minimal visibility
echo "--- DOCROOT (first 60) ---"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" \
  'sudo ls -la /usr/share/nginx/html | sed -n "1,60p" || true'

# Health check (try /healthz first if present)
if curl -fsS --max-time 8 "http://$EC2_IP/healthz" >/dev/null 2>&1; then
  :
else
  curl -fsS --max-time 8 "http://$EC2_IP/" >/dev/null || true
fi

echo "✅ Done → http://$EC2_IP/?buster=$(date +%s)"
exit 0

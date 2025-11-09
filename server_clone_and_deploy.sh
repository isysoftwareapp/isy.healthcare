#!/usr/bin/env bash
set -euo pipefail

# server_clone_and_deploy.sh
# Usage: sudo bash server_clone_and_deploy.sh [branch]
# This script will delete existing app folder, clone latest from GitHub,
# apply SSL nginx config (if present), and run a full from-scratch Docker Compose build and up.

REPO_URL="https://github.com/isysoftwareapp/isy.healthcare.git"
APP_DIR="/home/adminroot/isy.healthcare"
BRANCH="${1:-main}"

echo "Repo: $REPO_URL"
echo "Target dir: $APP_DIR"
echo "Branch: $BRANCH"

# Basic checks
if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Install git and re-run this script." >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed. Install docker and re-run this script." >&2
  exit 1
fi

# Remove existing folder if present
if [ -d "$APP_DIR" ]; then
  echo "Removing existing folder: $APP_DIR"
  sudo rm -rf "$APP_DIR"
fi

# Ensure parent exists and clone
sudo mkdir -p "$(dirname "$APP_DIR")"
# Try to run git clone as the current user
echo "Cloning repository..."
if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"; then
  echo "Clone successful"
else
  echo "git clone failed" >&2
  exit 1
fi

cd "$APP_DIR"

# If SSL nginx config is included, apply it
if [ -f "nginx-ssl.conf" ]; then
  echo "Applying nginx-ssl.conf to nginx.conf"
  sudo cp -f nginx-ssl.conf nginx.conf
fi

# Ensure ownership for current user (useful if script runs as root via sudo)
sudo chown -R $(whoami):$(whoami) "$APP_DIR" || true

# Create temporary swap on low-memory systems
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo || echo 0)
CREATED_SWAP=0
SWAPFILE_PATH=""
if [ "$MEM_MB" -lt 2000 ]; then
  echo "Low RAM detected (${MEM_MB}MB) - ensuring 2GB swap"

  # If /swapfile is already active, do nothing
  if sudo swapon --show=NAME --noheadings | grep -q '^/swapfile$'; then
    echo "/swapfile already active"
  else
    # Prefer to use /swapfile if possible; if it exists but isn't active, try to reuse it.
    if [ -f /swapfile ]; then
      echo "/swapfile exists but is not active. Attempting to activate it."
      sudo chmod 600 /swapfile || true
      if sudo mkswap /swapfile >/dev/null 2>&1; then
        if sudo swapon /swapfile; then
          SWAPFILE_PATH="/swapfile"
          CREATED_SWAP=1
        else
          echo "swapon failed for existing /swapfile"
        fi
      else
        echo "mkswap failed on existing /swapfile; will fall back to creating a new temporary swapfile"
      fi
    fi

    # If /swapfile is not present or activation failed, create a new swap file.
    if [ "$CREATED_SWAP" -eq 0 ]; then
      # try fallocate first (fast). If it fails, fall back to dd.
      if sudo fallocate -l 2G /swapfile >/dev/null 2>&1; then
        echo "created /swapfile with fallocate"
      else
        echo "fallocate failed, creating /swapfile with dd (slower)"
        sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
      fi
      sudo chmod 600 /swapfile || true
      if sudo mkswap /swapfile >/dev/null 2>&1; then
        if sudo swapon /swapfile; then
          SWAPFILE_PATH="/swapfile"
          CREATED_SWAP=1
        else
          echo "swapon failed for /swapfile"
        fi
      else
        echo "mkswap failed for /swapfile; giving up on creating swapfile"
      fi
    fi
  fi
fi

# Perform an opportunistic build-first deploy to minimize downtime
# Strategy:
#  - Build images first while existing containers remain running
#  - If build succeeds, recreate only the application service (fast swap)
#  - Wait for the app to respond on a local port (simple health check)
#  - If the partial update fails or app doesn't become healthy, fall back
#    to a full from-scratch deploy (the previous behavior)

SERVICE_NAME="${SERVICE_NAME:-app}"
SERVICE_PORT="${SERVICE_PORT:-3000}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-900}"   # seconds to wait for build
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"  # seconds to wait for app health
FALLBACK_FULL=0

echo "Pruning builder cache (optional)..."
sudo docker builder prune -af || true

echo "Building images (BuildKit, no-cache, pulling latest base images) - no downtime..."
sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo "Image build failed (exit $BUILD_EXIT). Aborting deploy and keeping existing containers up." >&2
  exit 1
fi

echo "Image build finished successfully. Attempting to recreate service '$SERVICE_NAME' only (minimize downtime)..."
if sudo docker compose up -d --no-deps --force-recreate "$SERVICE_NAME"; then
  echo "Service recreate started. Waiting up to ${HEALTH_TIMEOUT}s for the app to respond on port ${SERVICE_PORT}..."
  ELAPSED=0
  until curl -sSf --max-time 5 "http://127.0.0.1:${SERVICE_PORT}/" >/dev/null 2>&1 || [ $ELAPSED -ge $HEALTH_TIMEOUT ]; do
    sleep 2
    ELAPSED=$((ELAPSED+2))
    echo "Waiting for app to become healthy... ${ELAPSED}s"
  done

  if [ $ELAPSED -lt $HEALTH_TIMEOUT ]; then
    echo "App responded on port ${SERVICE_PORT} - deploy succeeded with minimal downtime."
  else
    echo "App did not respond within ${HEALTH_TIMEOUT}s after recreate. Will fallback to full rebuild."
    FALLBACK_FULL=1
  fi
else
  echo "Partial recreate of '$SERVICE_NAME' failed. Will attempt full rebuild." >&2
  FALLBACK_FULL=1
fi

if [ "$FALLBACK_FULL" -eq 1 ]; then
  echo "Performing full from-scratch deploy (will remove images and recreate all services)..."
  sudo docker compose down --remove-orphans --rmi all || true
  sudo docker builder prune -af || true
  sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'
  sudo docker compose up -d --force-recreate --renew-anon-volumes
fi

# Remove swap if created
if [ "$CREATED_SWAP" -eq 1 ]; then
  # Only remove the swap file we actually created/activated in this run
  if [ -n "$SWAPFILE_PATH" ]; then
    echo "Removing temporary swap at $SWAPFILE_PATH"
    sudo swapoff "$SWAPFILE_PATH" || true
    sudo rm -f "$SWAPFILE_PATH" || true
  else
    echo "CREATED_SWAP=1 but SWAPFILE_PATH is empty; skipping removal"
  fi
fi

echo "Deploy complete."

# Tail logs hint
echo "To follow logs: sudo docker compose logs -f"

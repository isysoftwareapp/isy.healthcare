#!/usr/bin/env bash
set -euo pipefail

# server_clone_and_deploy.sh
# Usage: sudo bash server_clone_and_deploy.sh [branch]
# This script will delete existing app folder, clone latest from GitHub,
# apply SSL nginx config (if present), and run a full from-scratch Docker Compose build and up.

REPO_URL="https://github.com/isysoftwareapp/isy.healthcare.git"
# By default promote the cloned release into the user's home directory so the
# repository contents appear at login (no extra enclosing folder).
APP_DIR="${APP_DIR:-$HOME}"
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

# Attempt to bring down any existing deployment and clean images/volumes so we
# start from a clean slate. This helps when the previous deploy's compose file
# can't be found but containers/images are still running.
clean_existing_deploy() {
  echo "Running pre-deploy cleanup..."

  FOUND_COMPOSE=0
  # Try a few common locations for previous deployments (including prior APP_DIR)
  for d in "$APP_DIR" "/home/adminroot/isy.healthcare" "/home/adminroot/latest"; do
    if [ -f "$d/docker-compose.yml" ] || [ -f "$d/docker-compose.yaml" ]; then
      echo "Found docker-compose in $d - running docker compose down"
      sudo sh -c "cd '$d' && docker compose down --remove-orphans --rmi all" || true
      FOUND_COMPOSE=1
    fi
  done

  if [ "$FOUND_COMPOSE" -eq 0 ]; then
    echo "No compose file found in common locations. Falling back to stopping containers by name prefix."
    # Stop/remove any containers with the isy-healthcare prefix
    IDS=$(sudo docker ps -aq --filter "name=isy-healthcare") || IDS=""
    if [ -n "$IDS" ]; then
      echo "Removing containers: $IDS"
      sudo docker rm -f $IDS || true
    else
      echo "No containers found with name filter 'isy-healthcare'"
    fi

    # Also attempt to stop common service containers if present
    for NAME in isy-healthcare-nginx isy-healthcare-mongodb isy-healthcare-certbot; do
      CID=$(sudo docker ps -aq --filter "name=$NAME" || true)
      if [ -n "$CID" ]; then
        echo "Removing container $NAME ($CID)"
        sudo docker rm -f $CID || true
      fi
    done

    # Remove any images built by prior releases matching our image name pattern
    IMG_IDS=$(sudo docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | awk '/isyhealthcare-app:/ {print $2}' || true)
    if [ -n "$IMG_IDS" ]; then
      echo "Removing images: $IMG_IDS"
      sudo docker rmi -f $IMG_IDS || true
    else
      echo "No matching isyhealthcare-app images found to remove"
    fi
  fi

  # Cleanup dangling volumes and networks to free space
  echo "Pruning unused volumes and networks..."
  sudo docker volume prune -f || true
  sudo docker network prune -f || true
  echo "Pre-deploy cleanup complete."
}

# Run the cleanup before creating release dir or cloning
clean_existing_deploy

# Create releases directory (outside APP_DIR) and prepare a new release path
RELEASES_ROOT="$(dirname "$APP_DIR")/releases"
sudo mkdir -p "$RELEASES_ROOT"
timestamp=$(date +%Y%m%d%H%M%S)
RELEASE_DIR="${RELEASES_ROOT}/${timestamp}"
echo "Preparing release dir: $RELEASE_DIR"
sudo mkdir -p "$RELEASE_DIR"

# Clone repository into the release directory (do not touch the running app yet)
echo "Cloning repository into release dir..."
if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE_DIR"; then
  echo "Clone successful to $RELEASE_DIR"
else
  echo "git clone failed" >&2
  sudo rm -rf "$RELEASE_DIR" || true
  exit 1
fi

cd "$RELEASE_DIR"

# If SSL nginx config is included, apply it into the release dir (we'll stage it)
if [ -f "nginx-ssl.conf" ]; then
  echo "Found nginx-ssl.conf in release; it will be used when promoted"
fi

# Ensure ownership for current user on the release dir
sudo chown -R $(whoami):$(whoami) "$RELEASE_DIR" || true

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

# Perform a full stop, rebuild and deploy from the freshly-cloned release.
# This is the "down first and rebuild" flow: stop existing services, build the
# release in the release dir using docker compose, start services, and promote
# the release dir to APP_DIR if the health check passes.

SERVICE_PORT="${SERVICE_PORT:-3000}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-900}"   # seconds to wait for build (unused currently)
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"  # seconds to wait for app health

echo "Stopping any existing services (docker compose down)..."
sudo docker compose down --remove-orphans --rmi all || true

echo "Pruning builder cache (optional)..."
sudo docker builder prune -af || true

echo "Building and starting services from release dir: $RELEASE_DIR"
cd "$RELEASE_DIR"

if ! sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'; then
  echo "docker compose build failed. Aborting deploy." >&2
  sudo rm -rf "$RELEASE_DIR" || true
  exit 1
fi

if ! sudo docker compose up -d --force-recreate --renew-anon-volumes; then
  echo "docker compose up failed. Aborting deploy." >&2
  sudo rm -rf "$RELEASE_DIR" || true
  exit 1
fi

echo "Waiting for application to respond on http://127.0.0.1:${SERVICE_PORT}/ up to ${HEALTH_TIMEOUT}s"
ELAPSED=0
until curl -sSf --max-time 5 "http://127.0.0.1:${SERVICE_PORT}/" >/dev/null 2>&1 || [ $ELAPSED -ge $HEALTH_TIMEOUT ]; do
  sleep 2
  ELAPSED=$((ELAPSED+2))
  echo "Waiting for app to become healthy... ${ELAPSED}s"
done

if [ $ELAPSED -lt $HEALTH_TIMEOUT ]; then
  echo "App is healthy. Promoting release to $APP_DIR"
  # Remove previous app dir and move this release into place for future reference
  echo "Promoting release contents into $APP_DIR (copying files into home directory)..."
  # Ensure the target home dir exists, then copy the release contents directly
  # into the home directory root so users see the repo at login (no extra folder).
  sudo mkdir -p "$APP_DIR"
  # Copy all files (including dotfiles) from the release into the home dir,
  # overwriting existing files where necessary.
  sudo cp -a "$RELEASE_DIR"/. "$APP_DIR"/
  # Fix ownership so the user owns the copied files.
  sudo chown -R $(whoami):$(whoami) "$APP_DIR" || true
  # Remove the temporary release directory now that contents are promoted.
  sudo rm -rf "$RELEASE_DIR" || true
  echo "Promotion complete. New app files are in $APP_DIR"
else
  echo "App did not become healthy within ${HEALTH_TIMEOUT}s. Aborting and cleaning release." >&2
  # Try to collect logs for debugging, then remove the newly-created release
  echo "Recent docker compose logs (tail 200):"
  sudo docker compose logs --no-color --tail 200 || true
  sudo docker compose down --remove-orphans || true
  sudo rm -rf "$RELEASE_DIR" || true
  exit 1
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

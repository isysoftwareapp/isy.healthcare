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

# Certbot settings (can be overridden via env)
DOMAIN="${DOMAIN:-health.isy.software}"
# Default email (user provided). Can be overridden with CERTBOT_EMAIL env var.
CERTBOT_EMAIL="${CERTBOT_EMAIL:-info.isysoftware@gmail.com}"
# If set to 1, use Let's Encrypt staging environment for testing.
CERTBOT_STAGING="${CERTBOT_STAGING:-0}"

echo "Stopping any existing services (docker compose down)..."
sudo docker compose down --remove-orphans --rmi all || true

echo "Pruning builder cache (optional)..."
sudo docker builder prune -af || true

echo "Building and starting services from release dir: $RELEASE_DIR"
cd "$RELEASE_DIR"

# Remove any existing containers with the compose service names to avoid name
# conflicts when docker compose attempts to create containers with fixed names.
for NAME in isy-healthcare isy-healthcare-nginx isy-healthcare-certbot isy-healthcare-mongodb; do
  CID=$(sudo docker ps -aq --filter "name=$NAME" || true)
  if [ -n "$CID" ]; then
    echo "Found existing container(s) for $NAME: $CID - removing to avoid conflict"
    sudo docker rm -f $CID || true
  fi
done


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

# After compose brought up containers (including certbot), ensure certificates
# exist for the DOMAIN. If missing, run a one-shot certbot container to issue
# them into the compose-created volumes so nginx can start with SSL files.
ensure_certs() {
  echo "Checking for existing certificates for $DOMAIN"
  # Prefer volumes actually mounted into the running certbot container (if present).
  CERTBOT_ETC_VOL=""
  CERTBOT_WWW_VOL=""
  if sudo docker ps -a --format '{{.Names}}' | grep -q '^isy-healthcare-certbot$'; then
    # inspect mounts of the certbot container to find the exact volumes used
    CERTBOT_ETC_VOL=$(sudo docker inspect --format "{{range .Mounts}}{{if eq .Destination \"/etc/letsencrypt\"}}{{.Name}}{{end}}{{end}}" isy-healthcare-certbot || true)
    CERTBOT_WWW_VOL=$(sudo docker inspect --format "{{range .Mounts}}{{if eq .Destination \"/var/www/certbot\"}}{{.Name}}{{end}}{{end}}" isy-healthcare-certbot || true)
  fi
  # Fallback: pick the newest named certbot volumes if the container isn't available or mounts not found
  if [ -z "$CERTBOT_ETC_VOL" ] || [ -z "$CERTBOT_WWW_VOL" ]; then
    CERTBOT_ETC_VOL=$(sudo docker volume ls --format '{{.Name}}' | grep 'certbot_etc' | sort -r | head -n1 || true)
    CERTBOT_WWW_VOL=$(sudo docker volume ls --format '{{.Name}}' | grep 'certbot_www' | sort -r | head -n1 || true)
  fi

  # If we still couldn't find certbot volumes, create fallback volumes and
  # attempt issuance using a one-shot certbot run that mounts them. The
  # fallback names can be overridden by environment variables
  # CERTBOT_ETC_FALLBACK and CERTBOT_WWW_FALLBACK.
  if [ -z "$CERTBOT_ETC_VOL" ] || [ -z "$CERTBOT_WWW_VOL" ]; then
    echo "Could not discover existing certbot volumes. Creating fallback volumes and running certbot to populate them."
    CERTBOT_ETC_VOL="${CERTBOT_ETC_FALLBACK:-certbot_etc}"
    CERTBOT_WWW_VOL="${CERTBOT_WWW_FALLBACK:-certbot_www}"
    echo "Creating volumes: $CERTBOT_ETC_VOL and $CERTBOT_WWW_VOL"
    sudo docker volume create "$CERTBOT_ETC_VOL" || true
    sudo docker volume create "$CERTBOT_WWW_VOL" || true

    echo "Running one-shot certbot to obtain certificates (fallback). This will bind host port 80 temporarily."
    STAGING_FLAG=""
    if [ "${CERTBOT_STAGING}" = "1" ]; then
      STAGING_FLAG="--staging"
    fi
    if ! sudo docker run --rm -p 80:80 \
      -v "$CERTBOT_ETC_VOL":/etc/letsencrypt \
      -v "$CERTBOT_WWW_VOL":/var/www/certbot \
      certbot/certbot certonly $STAGING_FLAG \
        --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$CERTBOT_EMAIL" \
        --agree-tos --no-eff-email --non-interactive; then
      echo "Fallback one-shot certbot run failed to obtain certificates for $DOMAIN" >&2
      return 2
    fi
    echo "Fallback certbot run succeeded; certificates stored in $CERTBOT_ETC_VOL"
  fi

  if [ -z "$CERTBOT_ETC_VOL" ] || [ -z "$CERTBOT_WWW_VOL" ]; then
    echo "Could not find certbot volumes (certbot_etc / certbot_www). Skipping automated cert issuance." >&2
    return 1
  fi

  echo "Found volumes: certs=$CERTBOT_ETC_VOL webroot=$CERTBOT_WWW_VOL"

  # Check if cert already exists (use a small container to inspect the volume)
  if sudo docker run --rm -v "$CERTBOT_ETC_VOL":/etc/letsencrypt alpine sh -c 'test -d /etc/letsencrypt/live/'"$DOMAIN"' && echo present || echo missing' | grep -q present; then
    echo "Certificates already present for $DOMAIN"
    return 0
  fi

  echo "No certificates found for $DOMAIN - attempting to obtain via certbot"
  echo "CERTBOT_EMAIL=$CERTBOT_EMAIL"

  # Wait for nginx (or any service) to be listening on port 80 so HTTP-01
  # challenges created in the webroot can be fetched. Retry up to 30s.
  echo "Waiting for port 80 to be reachable (so webroot challenges can be served)..."
  WAITED=0
  until sudo ss -lntp 2>/dev/null | grep -q ':80\s' || [ $WAITED -ge 30 ]; do
    sleep 2
    WAITED=$((WAITED+2))
    echo "  waiting... ${WAITED}s"
  done
  if [ $WAITED -ge 30 ]; then
    echo "Port 80 not reachable on host after ${WAITED}s — webroot challenges may fail. Will still attempt but may fallback to standalone."
  else
    echo "Port 80 reachable — proceeding with webroot issuance attempts."
  fi

  # Try webroot issuance up to 3 times (use existing certbot container if present)
  ATTEMPT=0
  MAX_ATTEMPTS=3
  SUCCESS=0
  while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT+1))
    echo "Certbot webroot attempt $ATTEMPT/$MAX_ATTEMPTS"
    if sudo docker ps -a --format '{{.Names}}' | grep -q '^isy-healthcare-certbot$'; then
      # ensure it's running
      if ! sudo docker ps --format '{{.Names}}' | grep -q '^isy-healthcare-certbot$'; then
        echo "Starting existing certbot container"
        sudo docker start isy-healthcare-certbot || true
      fi
      if sudo docker exec isy-healthcare-certbot certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive; then
        SUCCESS=1
        break
      fi
    else
      if sudo docker run --rm -v "$CERTBOT_ETC_VOL":/etc/letsencrypt -v "$CERTBOT_WWW_VOL":/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive; then
        SUCCESS=1
        break
      fi
    fi
    echo "Webroot attempt $ATTEMPT failed, retrying after delay..."
    sleep $((ATTEMPT * 5))
  done

  if [ $SUCCESS -eq 0 ]; then
    echo "All webroot attempts failed. Falling back to standalone issuance."
    # Stop nginx temporarily if it's running so standalone can bind :80
    if sudo docker ps -q --filter name=isy-healthcare-nginx | grep -q .; then
      echo "Stopping nginx container to free port 80 for standalone certbot"
      sudo docker rm -f isy-healthcare-nginx || true
    fi

    STAGING_FLAG=""
    if [ "${CERTBOT_STAGING}" = "1" ]; then
      STAGING_FLAG="--staging"
    fi

    if ! sudo docker run --rm -p 80:80 -v "$CERTBOT_ETC_VOL":/etc/letsencrypt -v "$CERTBOT_WWW_VOL":/var/www/certbot certbot/certbot certonly $STAGING_FLAG --standalone -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive; then
      echo "Standalone certbot run failed to obtain certificates for $DOMAIN" >&2
      return 2
    fi
    echo "Standalone certbot run succeeded"
    # restart nginx so it picks up certs (compose will recreate with our config)
    sudo docker compose up -d --force-recreate --no-deps nginx || true
  fi
}

ensure_certs || true

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

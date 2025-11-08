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
if [ "$MEM_MB" -lt 2000 ]; then
  echo "Low RAM detected (${MEM_MB}MB) - creating 2GB swap"
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  CREATED_SWAP=1
fi

# Perform full from-scratch deploy
echo "Shutting down any existing compose stacks and removing images..."
sudo docker compose down --remove-orphans --rmi all || true

echo "Pruning builder cache..."
sudo docker builder prune -af || true

echo "Building images (BuildKit, no-cache, pulling latest base images)..."
sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'

echo "Starting services (force recreate)..."
sudo docker compose up -d --force-recreate --renew-anon-volumes

# Remove swap if created
if [ "$CREATED_SWAP" -eq 1 ]; then
  echo "Removing temporary swap"
  sudo swapoff /swapfile || true
  sudo rm -f /swapfile || true
fi

echo "Deploy complete."

# Tail logs hint
echo "To follow logs: sudo docker compose logs -f"

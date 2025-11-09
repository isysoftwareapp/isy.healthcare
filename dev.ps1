#!/usr/bin/env pwsh
# Local development deployment script for isy.healthcare
# Uses HTTP-only configuration (no SSL)

Write-Host "=== Starting isy.healthcare in Development Mode ===" -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Backup current nginx.conf if it exists
if (Test-Path "nginx.conf") {
    Write-Host "`nBacking up current nginx.conf..." -ForegroundColor Yellow
    Copy-Item "nginx.conf" "nginx.conf.backup" -Force
}

# Copy HTTP-only nginx configuration
Write-Host "`nConfiguring nginx for HTTP (development mode)..." -ForegroundColor Yellow
Copy-Item "nginx-http-only.conf" "nginx.conf" -Force

# Check if .env file exists, create from example if not
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "`nCreating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env" -Force
        Write-Host "Please update .env file with your local configuration!" -ForegroundColor Cyan
    } else {
        Write-Host "`nWarning: No .env or .env.example file found!" -ForegroundColor Yellow
    }
}

# Create docker-compose.dev.yml for local development
Write-Host "`nCreating development docker-compose configuration..." -ForegroundColor Yellow

$devComposeContent = @"
version: "3.8"

services:
  mongodb:
    image: mongo:7.0
    container_name: isy-healthcare-mongodb-dev
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=DevPassword123!
      - MONGO_INITDB_DATABASE=isy_clinic
    volumes:
      - mongodb_data_dev:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"

  app:
    build: .
    container_name: isy-healthcare-dev
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_APP_NAME=ISY Healthcare (Dev)
      - NEXT_PUBLIC_APP_URL=http://localhost
      - MONGODB_URI=mongodb://admin:DevPassword123!@mongodb:27017/isy_clinic?authSource=admin
      - NEXTAUTH_URL=http://localhost
      - NEXTAUTH_SECRET=DEV_SECRET_KEY_FOR_LOCAL_TESTING_MIN_32_CHARS
      - JWT_SECRET=DEV_JWT_SECRET_FOR_LOCAL_TESTING
      - MAX_FILE_SIZE=10485760
      - UPLOAD_DIR=/app/uploads
      - DEFAULT_CURRENCY=IDR
      - EXCHANGE_RATE_EUR_TO_IDR=17500
      - EXCHANGE_RATE_USD_TO_IDR=15800
    depends_on:
      - mongodb
    volumes:
      - ./app:/app/app
      - ./components:/app/components
      - ./lib:/app/lib
      - ./models:/app/models
      - ./public:/app/public
      - ./types:/app/types

  nginx:
    image: nginx:alpine
    container_name: isy-healthcare-nginx-dev
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data_dev:
    driver: local
"@

Set-Content -Path "docker-compose.dev.yml" -Value $devComposeContent

Write-Host "`nBuilding new image (down-first: stop old container, then rebuild)" -ForegroundColor Yellow

# Ensure local Next.js build is fresh so the container image contains an up-to-date
# production `.next` (this compiles all app router pages). This helps avoid stale
# cached pages causing 404s for newly added routes.
Write-Host "\nCleaning local build artifacts and running local npm build..." -ForegroundColor Yellow
if (Test-Path ".next") {
  Write-Output "Removing existing .next directory..."
  Remove-Item -Recurse -Force ".next"
}

# Run local Next.js build to produce a fresh .next before building the docker image.
# Use the PowerShell call operator which is reliable for npm on Windows.
Write-Output "Running: npm run build"
& npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Local 'npm run build' failed. Aborting dev build." -ForegroundColor Red
  exit 1
}

# Detect old container (if any) and stop it so we rebuild from a clean state
$oldContainerInfo = docker ps -a --filter "name=isy-healthcare-dev" --format "{{.ID}} {{.Image}} {{.Status}}" 2>$null
$oldContainerId = $null
$oldContainerImage = $null
if ($oldContainerInfo -and $oldContainerInfo.Trim() -ne "") {
  $parts = $oldContainerInfo -split '\s+'
  $oldContainerId = $parts[0]
  $oldContainerImage = $parts[1]
  Write-Output "Found existing container isy-healthcare-dev (id: $oldContainerId, image: $oldContainerImage). Stopping it now..."
  docker stop $oldContainerId | Out-Null
} else {
  Write-Output "No existing isy-healthcare-dev container found. Proceeding to build." 
}

# Build with BuildKit enabled first, then fallback to no-cache if necessary
$buildSucceeded = $false
Write-Output "Attempt 1: docker compose build (BuildKit)"
$env:COMPOSE_DOCKER_CLI_BUILD = '1'
$env:DOCKER_BUILDKIT = '1'
& docker compose -f docker-compose.dev.yml build
$exitCode = $LASTEXITCODE
Remove-Item Env:COMPOSE_DOCKER_CLI_BUILD -ErrorAction SilentlyContinue
Remove-Item Env:DOCKER_BUILDKIT -ErrorAction SilentlyContinue
if ($exitCode -eq 0) { $buildSucceeded = $true }

if (-not $buildSucceeded) {
  Write-Output "Attempt 1 failed. Pruning builder and retrying with no-cache..."
  docker builder prune -af | Out-Null
  Write-Output "Attempt 2: docker compose build --no-cache"
  & docker compose -f docker-compose.dev.yml build --no-cache
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq 0) { $buildSucceeded = $true }
}

if (-not $buildSucceeded) {
  Write-Host "Build failed after retries. Attempting to restart previous container (if any) and aborting." -ForegroundColor Red
  if ($oldContainerId) {
    Write-Output "Restarting previous container $oldContainerId..."
    docker start $oldContainerId | Out-Null
  }
  exit 1
}

# Build succeeded — bring up the app service from the freshly built image
Write-Output "Build succeeded. Starting app service using docker compose..."
& docker compose -f docker-compose.dev.yml up -d app
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to start app via docker compose. Attempting to restart previous container (if any) and aborting." -ForegroundColor Red
  if ($oldContainerId) { docker start $oldContainerId | Out-Null }
  exit 1
}

# Health-check the new app on port 3000
$healthOk = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 5
    if ($resp.StatusCode -eq 200) { $healthOk = $true; break }
  } catch { }
  Start-Sleep -Seconds 2
}

if ($healthOk) {
  Write-Host "New app is healthy and running on http://localhost:3000" -ForegroundColor Green
  Write-Output "To view logs: docker compose -f docker-compose.dev.yml logs -f app"
} else {
  Write-Host "New app failed healthcheck. See logs and rolling back to previous container (if available)." -ForegroundColor Red
  docker compose -f docker-compose.dev.yml logs --tail=200 app
  if ($oldContainerId) {
    Write-Output "Starting previous container $oldContainerId..."
    docker start $oldContainerId | Out-Null
    Write-Host "Previous container restarted (id: $oldContainerId)." -ForegroundColor Yellow
  }
  exit 1
}
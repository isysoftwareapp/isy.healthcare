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

# Check if image exists, build only if needed
$imageExists = docker images -q isy-healthcare-dev-app 2>$null
$shouldBuild = $false

if (-not $imageExists) {
    Write-Host "`nNo existing dev image found. Building for first time..." -ForegroundColor Yellow
    $shouldBuild = $true
} else {
    # Check if Dockerfile or package.json changed (indicating dependency changes)
    Write-Host "`nChecking if rebuild is needed..." -ForegroundColor Yellow
    $dockerfileHash = (Get-FileHash "Dockerfile" -Algorithm MD5 -ErrorAction SilentlyContinue).Hash
    $packageHash = (Get-FileHash "package.json" -Algorithm MD5 -ErrorAction SilentlyContinue).Hash
    $hashFile = ".dev-build-hash"
    
    $needsRebuild = $false
    if (Test-Path $hashFile) {
        $savedHash = Get-Content $hashFile -Raw
        $currentHash = "$dockerfileHash|$packageHash"
        if ($savedHash -ne $currentHash) {
            Write-Host "Dockerfile or package.json changed. Rebuild required." -ForegroundColor Yellow
            $needsRebuild = $true
        }
    } else {
        $needsRebuild = $true
    }
    
    if ($needsRebuild) {
        $shouldBuild = $true
        "$dockerfileHash|$packageHash" | Set-Content $hashFile
    } else {
        Write-Host "No dependency changes detected. Skipping build (using volume mounts for code)." -ForegroundColor Green
    }
}

if ($shouldBuild) {
    Write-Host "`nBuilding Docker image..." -ForegroundColor Yellow
    
    # Stop existing containers
    docker compose -f docker-compose.dev.yml down 2>$null | Out-Null
    
    # Build with BuildKit
    $env:COMPOSE_DOCKER_CLI_BUILD = '1'
    $env:DOCKER_BUILDKIT = '1'
    & docker compose -f docker-compose.dev.yml build
    $exitCode = $LASTEXITCODE
    Remove-Item Env:COMPOSE_DOCKER_CLI_BUILD -ErrorAction SilentlyContinue
    Remove-Item Env:DOCKER_BUILDKIT -ErrorAction SilentlyContinue
    
    if ($exitCode -ne 0) {
        Write-Host "Build failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
    Write-Host "Build completed successfully!" -ForegroundColor Green
}

# Start services (this is fast since code is mounted via volumes)
Write-Host "`nStarting services..." -ForegroundColor Yellow
& docker compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start services." -ForegroundColor Red
    exit 1
}

# Quick health check
Write-Host "`nWaiting for app to be ready..." -ForegroundColor Yellow
$healthOk = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) { 
            $healthOk = $true
            break 
        }
    } catch { }
    Start-Sleep -Seconds 2
}

if ($healthOk) {
    Write-Host "`n=== Development server is ready! ===" -ForegroundColor Green
    Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Database: mongodb://localhost:27017" -ForegroundColor Cyan
    Write-Host "`nYour code changes will be reflected automatically (volume mounts)." -ForegroundColor Yellow
    Write-Host "To view logs: docker compose -f docker-compose.dev.yml logs -f app" -ForegroundColor Gray
    Write-Host "To stop: docker compose -f docker-compose.dev.yml down" -ForegroundColor Gray
} else {
    Write-Host "`nApp failed to start. Checking logs..." -ForegroundColor Red
    docker compose -f docker-compose.dev.yml logs --tail=100 app
    exit 1
}
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

Write-Host "`nStopping existing containers..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml down 2>$null

Write-Host "`nBuilding and starting containers..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Development environment started successfully! ===" -ForegroundColor Green
    Write-Host "`nAccess the application at:" -ForegroundColor Cyan
    Write-Host "  http://localhost" -ForegroundColor White
    Write-Host "`nMongoDB is accessible at:" -ForegroundColor Cyan
    Write-Host "  mongodb://admin:DevPassword123!@localhost:27017" -ForegroundColor White
    Write-Host "`nTo view logs:" -ForegroundColor Cyan
    Write-Host "  docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
    Write-Host "`nTo stop:" -ForegroundColor Cyan
    Write-Host "  docker compose -f docker-compose.dev.yml down" -ForegroundColor White
} else {
    Write-Host "`nFailed to start development environment!" -ForegroundColor Red
    Write-Host "Check logs with: docker compose -f docker-compose.dev.yml logs" -ForegroundColor Yellow
    exit 1
}
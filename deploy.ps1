#!/usr/bin/env pwsh
# Deploy script for isy.healthcare to VPS (Production with HTTPS)

Write-Host "=== Deploying isy.healthcare to VPS (Production) ===" -ForegroundColor Green

# Configuration
$VPS_IP = "103.126.116.50"
$VPS_USER = "adminroot"
$APP_DIR = "/home/adminroot/isy.healthcare"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

# Backup current nginx.conf and use SSL configuration
Write-Host "`nPreparing SSL configuration for production..." -ForegroundColor Yellow
if (Test-Path "nginx.conf") {
    Copy-Item "nginx.conf" "nginx.conf.backup" -Force
}
if (Test-Path "nginx-ssl.conf") {
    Copy-Item "nginx-ssl.conf" "nginx.conf" -Force
    Write-Host "Using HTTPS/SSL configuration" -ForegroundColor Green
} else {
    Write-Host "Warning: nginx-ssl.conf not found; keeping existing nginx.conf" -ForegroundColor Yellow
}

# Ensure remote directories exist
Write-Host "`nEnsuring remote directories exist..." -ForegroundColor Yellow
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "mkdir -p ${APP_DIR}/app ${APP_DIR}/public ${APP_DIR}/lib ${APP_DIR}/models ${APP_DIR}/components ${APP_DIR}/types ${APP_DIR}/locales ${APP_DIR}/mongo-init"

# Upload configuration files
Write-Host "`nUploading configuration files..." -ForegroundColor Yellow
scp -i $SSH_KEY Dockerfile docker-compose.yml nginx.conf nginx-http-only.conf nginx-ssl.conf setup-ssl.sh deploy.sh .env.example package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs next-env.d.ts middleware.ts i18n.ts tailwind.config.ts "${VPS_USER}@${VPS_IP}:${APP_DIR}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload configuration files!" -ForegroundColor Red
    if (Test-Path "nginx.conf.backup") { Move-Item "nginx.conf.backup" "nginx.conf" -Force }
    exit 1
}

# Upload directories one by one
$directories = @(
    @{Name="app"; Required=$true},
    @{Name="components"; Required=$true},
    @{Name="lib"; Required=$true},
    @{Name="models"; Required=$true},
    @{Name="types"; Required=$true},
    @{Name="locales"; Required=$false},
    @{Name="public"; Required=$false},
    @{Name="mongo-init"; Required=$false}
)

Write-Host "`nUploading directories..." -ForegroundColor Yellow
foreach ($dir in $directories) {
    $dirName = $dir.Name
    $isRequired = $dir.Required
    
    if (Test-Path $dirName) {
        Write-Host "Uploading $dirName directory..." -ForegroundColor Cyan
        scp -r -i $SSH_KEY $dirName "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
        
        if ($LASTEXITCODE -ne 0) {
            if ($isRequired) {
                Write-Host "Failed to upload required directory: $dirName" -ForegroundColor Red
                if (Test-Path "nginx.conf.backup") { Move-Item "nginx.conf.backup" "nginx.conf" -Force }
                exit 1
            } else {
                Write-Host "Warning: Failed to upload optional directory: $dirName" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [OK] $dirName uploaded" -ForegroundColor Green
        }
    } else {
        if ($isRequired) {
            Write-Host "Error: Required directory '$dirName' not found!" -ForegroundColor Red
            if (Test-Path "nginx.conf.backup") { Move-Item "nginx.conf.backup" "nginx.conf" -Force }
            exit 1
        } else {
            Write-Host "  Skipping optional directory: $dirName (not found)" -ForegroundColor Gray
        }
    }
}


# Restore nginx.conf backup if it exists
if (Test-Path "nginx.conf.backup") {
    Write-Host "`nRestoring nginx.conf from backup..." -ForegroundColor Yellow
    Move-Item "nginx.conf.backup" "nginx.conf" -Force
}

Write-Host "`n=== Files uploaded successfully! ===" -ForegroundColor Green

# Build and start on VPS
Write-Host "`nBuilding and starting application on VPS..." -ForegroundColor Cyan
# On low-RAM VPS (e.g. 1GB) the Next.js build can OOM. Create a temporary swapfile on the remote host
Write-Host "\nChecking remote memory and preparing temporary swap if needed..." -ForegroundColor Yellow
$createdSwap = $false
try {
    $remoteMemStr = ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "awk '/MemTotal/ {print int(\$2/1024)}' /proc/meminfo" 2>&1
    if ($remoteMemStr -and ($remoteMemStr -as [int]) -lt 2000) {
        Write-Host "Remote memory is $remoteMemStr MB (<2GB). Creating 2GB swap on remote..." -ForegroundColor Yellow
        ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048; sudo chmod 600 /swapfile; sudo mkswap /swapfile; sudo swapon /swapfile; echo SWAP_ON"
        if ($LASTEXITCODE -eq 0) { $createdSwap = $true; Write-Host 'Remote swap created' -ForegroundColor Green } else { Write-Host 'Failed to create remote swap (continuing, build may still fail)' -ForegroundColor Yellow }
    } else {
        Write-Host "Remote memory is $remoteMemStr MB (>=2GB) - no swap needed" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not determine remote memory: $_" -ForegroundColor Yellow
}

try {
    # Perform a full, non-cached rebuild on the remote host:
    # - bring compose down
    # - remove previous images used by compose to force rebuild (--rmi all)
    # - prune docker builder cache
    # - run a BuildKit-enabled no-cache build and pull latest base images
    # - recreate containers, forcing recreation
    # Note: this will NOT remove Docker volumes (DB data) but WILL remove images;
    # if you want to preserve existing images, remove the --rmi all flag.
    ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "cd ${APP_DIR}; sudo docker compose down --remove-orphans --rmi all; sudo docker builder prune -af || true; sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'; sudo docker compose up -d --force-recreate --renew-anon-volumes"
    $buildExit = $LASTEXITCODE
} finally {
    if ($createdSwap) {
        Write-Host "\nRemoving temporary swap on remote..." -ForegroundColor Yellow
        ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo swapoff /swapfile || true; sudo rm -f /swapfile || true; echo SWAP_REMOVED"
    }
}

if ($buildExit -eq 0) {
    Write-Host "`n=== Deployment completed successfully! ===" -ForegroundColor Green
    Write-Host "`nApplication is now running at:" -ForegroundColor Cyan
    Write-Host "  https://isy.healthcare" -ForegroundColor White
    Write-Host "  https://${VPS_IP}" -ForegroundColor White
} else {
    Write-Host "`n=== Build failed! Check logs above ===" -ForegroundColor Red
    Write-Host "`nTo view logs, run:" -ForegroundColor Yellow
    Write-Host "  ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR}; sudo docker compose logs -f'" -ForegroundColor White
}

Write-Host "`nNote: Make sure SSL certificates are set up on the server!" -ForegroundColor Yellow
Write-Host "If not, run setup-ssl.sh on the server first." -ForegroundColor Yellow

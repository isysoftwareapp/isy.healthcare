#!/usr/bin/env pwsh
# Deploy script for isy.healthcare to VPS (Production with HTTPS)

Write-Host "=== Deploying isy.healthcare to VPS (Production) ===" -ForegroundColor Green

# Configuration
$VPS_IP = "103.126.116.50"
$VPS_USER = "adminroot"
$APP_DIR = "/home/adminroot/isy.healthcare"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
# Production domain (change this to your real domain)
$DOMAIN = "health.isy.software"

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

# Prepare a temporary upload location on the remote host (upload to /tmp to avoid permission issues)
Write-Host "`nPreparing remote temporary upload directory..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$remoteTmp = "/tmp/isy_deploy_$timestamp"

Write-Host "Uploading project files to remote temp: $remoteTmp" -ForegroundColor Cyan

# Create remote tmp dir
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "mkdir -p ${remoteTmp} && chmod 700 ${remoteTmp}"

# Upload files and directories to remote temp dir. We upload the whole repo pieces so rsync on remote can place them under a release dir.
$uploadPaths = @("Dockerfile","docker-compose.yml","nginx.conf","nginx-http-only.conf","nginx-ssl.conf","setup-ssl.sh","deploy.sh",".env.example","package.json","package-lock.json","next.config.ts","tsconfig.json","postcss.config.mjs","eslint.config.mjs","next-env.d.ts","middleware.ts","i18n.ts","tailwind.config.ts")
foreach ($p in $uploadPaths) {
    if (Test-Path $p) {
        Write-Host "Uploading $p..." -ForegroundColor Gray
        scp -i $SSH_KEY $p "${VPS_USER}@${VPS_IP}:${remoteTmp}/"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed uploading $p to remote temp dir" -ForegroundColor Red
            if (Test-Path "nginx.conf.backup") { Move-Item "nginx.conf.backup" "nginx.conf" -Force }
            exit 1
        }
    }
}

# Upload directories
$directories = @("app","components","lib","models","types","locales","public","mongo-init")
foreach ($d in $directories) {
    if (Test-Path $d) {
        Write-Host "Uploading directory $d..." -ForegroundColor Gray
        scp -r -i $SSH_KEY $d "${VPS_USER}@${VPS_IP}:${remoteTmp}/"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: failed to upload directory $d to remote temp" -ForegroundColor Yellow
        }
    }
}

Write-Host "Upload to remote tmp complete." -ForegroundColor Green

# Move files from temp into a release directory on the remote host with sudo to avoid permission issues
$releaseDir = "${APP_DIR}/releases/$timestamp"
Write-Host "Creating release directory on remote: $releaseDir" -ForegroundColor Yellow
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo mkdir -p ${releaseDir} && sudo rsync -a ${remoteTmp}/ ${releaseDir}/ && sudo chown -R ${VPS_USER}:${VPS_USER} ${releaseDir} && sudo rm -rf ${remoteTmp}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to move uploaded files into release dir on remote" -ForegroundColor Red
    if (Test-Path "nginx.conf.backup") { Move-Item "nginx.conf.backup" "nginx.conf" -Force }
    exit 1
}

Write-Host "Files staged in remote release dir: $releaseDir" -ForegroundColor Green

# Template nginx configuration files for the target domain so the deployed
# nginx will use the correct server_name and certificate paths.
Write-Host "Templating nginx configs with domain $DOMAIN on remote" -ForegroundColor Yellow
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo sed -i \"s/server_name .*/server_name $DOMAIN;/g\" ${releaseDir}/nginx-ssl.conf ${releaseDir}/nginx-http-only.conf || true; sudo sed -i \"s#/etc/letsencrypt/live/[^/]*/#/etc/letsencrypt/live/$DOMAIN/#g\" ${releaseDir}/nginx-ssl.conf || true"



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
    # Build image on remote in the release dir and run a canary container on port 3001
    $imageTag = "isyhealthcare-app:release-$timestamp"
    Write-Host "Building docker image on remote (tag: $imageTag)" -ForegroundColor Yellow
    ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "cd ${releaseDir}; sudo docker builder prune -af || true; sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker build -t ${imageTag} .'"
    if ($LASTEXITCODE -ne 0) { throw "Remote docker build failed" }

    # Start canary container on port 3001 (so it doesn't conflict with the running app on 3000)
    $canaryName = "isyhealthcare_canary_$timestamp"
    Write-Host "Starting canary container $canaryName on remote port 3001" -ForegroundColor Yellow
    ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo docker rm -f ${canaryName} 2>/dev/null || true; sudo docker run -d --name ${canaryName} -p 3001:3000 ${imageTag}"
    if ($LASTEXITCODE -ne 0) { throw "Failed to start canary container" }

    # Health-check the canary for up to 30s
    Write-Host "Health-checking canary (http://localhost:3001)" -ForegroundColor Yellow
    $healthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        $out = ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/ || true"
        if ($out -eq '200') { $healthy = $true; break }
        Start-Sleep -Seconds 2
    }

    if (-not $healthy) {
        Write-Host "Canary failed healthcheck. Leaving existing app running and cleaning up canary." -ForegroundColor Red
        ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo docker rm -f ${canaryName} 2>/dev/null || true"
        throw "Canary healthcheck failed"
    }

    Write-Host "Canary is healthy. Promoting to production..." -ForegroundColor Green

    # Swap: stop existing app and start new container on port 3000 using the new image
    # NOTE: this introduces a very short downtime during the stop/start swap. For true zero-downtime
    # you must route traffic through a reverse-proxy (nginx) and reload it to point to the canary.
    Write-Host "Stopping existing production container (if any) and starting new one" -ForegroundColor Yellow
    ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo docker rm -f isy-healthcare 2>/dev/null || true; sudo docker run -d --name isy-healthcare -p 3000:3000 ${imageTag}"
    if ($LASTEXITCODE -ne 0) { throw "Failed to start production container" }

    # Remove the canary container after successful promotion
    ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo docker rm -f ${canaryName} 2>/dev/null || true"

    $buildExit = 0
} finally {
    if ($createdSwap) {
        Write-Host "\nRemoving temporary swap on remote..." -ForegroundColor Yellow
        ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "sudo swapoff /swapfile || true; sudo rm -f /swapfile || true; echo SWAP_REMOVED"
    }
}

if ($buildExit -eq 0) {
    Write-Host "`n=== Deployment completed successfully! ===" -ForegroundColor Green
    Write-Host "`nApplication is now running at:" -ForegroundColor Cyan
    Write-Host "  https://$DOMAIN" -ForegroundColor White
    Write-Host "  https://${VPS_IP}" -ForegroundColor White
} else {
    Write-Host "`n=== Build failed! Check logs above ===" -ForegroundColor Red
    Write-Host "`nTo view logs, run:" -ForegroundColor Yellow
    Write-Host "  ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR}; sudo docker compose logs -f'" -ForegroundColor White
}

Write-Host "`nNote: Make sure SSL certificates are set up on the server!" -ForegroundColor Yellow
Write-Host "If not, run setup-ssl.sh on the server first." -ForegroundColor Yellow

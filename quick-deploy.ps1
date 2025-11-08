#!/usr/bin/env pwsh
# Quick Deploy - Only uploads changed files (faster for development)

Write-Host "=== Quick Deploy to VPS ===" -ForegroundColor Green

# Configuration
$VPS_IP = "103.126.116.50"
$VPS_USER = "adminroot"
$APP_DIR = "/home/adminroot/isy.healthcare"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"

# Check if rsync is available (faster than scp)
$useRsync = $false
try {
    $rsyncCheck = Get-Command rsync -ErrorAction SilentlyContinue
    if ($rsyncCheck) {
        $useRsync = $true
        Write-Host "Using rsync for faster incremental upload" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Using scp (install rsync for faster uploads)" -ForegroundColor Yellow
}

# Directories to sync
$syncDirs = @("app", "components", "lib", "models", "types", "public", "mongo-init")

# Files to sync
$syncFiles = @(
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "middleware.ts",
    "Dockerfile",
    "docker-compose.yml"
)

Write-Host "`nUploading files..." -ForegroundColor Yellow

# Upload individual files
foreach ($file in $syncFiles) {
    if (Test-Path $file) {
        scp -i $SSH_KEY $file "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $file" -ForegroundColor Green
        } else {
            Write-Host "✗ $file failed" -ForegroundColor Red
        }
    }
}

# Upload directories
foreach ($dir in $syncDirs) {
    if (Test-Path $dir) {
        Write-Host "`nSyncing $dir..." -ForegroundColor Yellow
        
        if ($useRsync) {
            # Use rsync for incremental upload (much faster)
            rsync -avz --delete -e "ssh -i $SSH_KEY" "$dir/" "${VPS_USER}@${VPS_IP}:${APP_DIR}/$dir/"
        } else {
            # Fallback to scp
            scp -i $SSH_KEY -r $dir "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $dir synced" -ForegroundColor Green
        } else {
            Write-Host "✗ $dir failed" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Upload complete! ===" -ForegroundColor Green
Write-Host "`nRebuilding application on VPS..." -ForegroundColor Cyan

# Rebuild and restart
ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} "cd ${APP_DIR} && sudo docker compose down && sudo docker compose up -d --build"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Deployment completed! ===" -ForegroundColor Green
} else {
    Write-Host "`n=== Build failed! ===" -ForegroundColor Red
}

Write-Host "`nTo view logs:" -ForegroundColor Yellow
Write-Host "  ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'cd ${APP_DIR} && sudo docker compose logs -f app'" -ForegroundColor White

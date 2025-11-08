#!/usr/bin/env pwsh
<#
Quick ZIP-based deploy script
- Creates a staging copy of `isy.healthcare`
- Removes `node_modules` and `.next` from the staging copy to minimize zip size
- Creates `isy_healthcare_deploy_<timestamp>.zip`
- SCPs the zip to the VPS into the target app directory
- On the VPS: unzips (with fallback), ensures `nginx-ssl.conf` is applied to `nginx.conf`, performs a full no-cache BuildKit build and brought up containers (force recreate)

Notes:
- This script does NOT remove local working files. It copies to a temporary staging folder and zips that.
- Removes only the heavy folders `node_modules` and `.next` in the staging copy.
- Requires `scp` and `ssh` available in your PowerShell environment.
- Uses temporary swap on remote if RAM < 2GB (to help builds on 1GB VPS).
#>

param(
    [string]$VPS_IP = "103.126.116.50",
    [string]$VPS_USER = "adminroot",
    [string]$APP_DIR = "/home/adminroot/isy.healthcare",
    [string]$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa",
    [switch]$KeepLocalStaging
)

Write-Host "=== ZIP Deploy: staging, zip, upload, remote unzip & rebuild ===" -ForegroundColor Green

# Paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFolderName = "isy.healthcare"
$sourcePath = Join-Path $projectRoot $sourceFolderName
if (-not (Test-Path $sourcePath)) {
    Write-Host "Source folder not found: $sourcePath" -ForegroundColor Red
    exit 1
}

# Prepare staging
$timestamp = (Get-Date -UFormat "%Y%m%d%H%M%S")
$staging = Join-Path $env:TEMP "isy_deploy_staging_$timestamp"
Write-Host "Creating staging folder: $staging" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $staging -Force | Out-Null

Write-Host "Copying $sourcePath -> $staging (this may take a few seconds)..." -ForegroundColor Cyan
# Use Robocopy for faster, robust copy on Windows
$robocopyArgs = @("`"$sourcePath`"", "`"$staging`"", "/E", "/COPYALL", "/R:2", "/W:1")
$rc = Start-Process -FilePath robocopy -ArgumentList $robocopyArgs -NoNewWindow -Wait -PassThru
if ($rc.ExitCode -ge 8) {
    Write-Host "Robocopy failed with exit code $($rc.ExitCode)" -ForegroundColor Red
    Remove-Item -Recurse -Force $staging
    exit 1
}

# Remove heavy folders in staging to make the archive small
$toRemove = @("node_modules", ".next")
foreach ($r in $toRemove) {
    $p = Join-Path $staging $r
    if (Test-Path $p) {
        Write-Host "Removing $p from staging..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
    }
}

# Zip the staging folder
$zipName = "isy_healthcare_deploy_$timestamp.zip"
$zipPath = Join-Path $env:TEMP $zipName
Write-Host "Creating zip: $zipPath" -ForegroundColor Cyan
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

try {
    Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force -CompressionLevel Optimal
} catch {
    Write-Host "Compress-Archive failed: $_. Exception. Trying fallback via 7z if available..." -ForegroundColor Yellow
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        & 7z a -tzip $zipPath (Join-Path $staging "*") | Write-Host
    } else {
        Write-Host "No fallback archiver available. Aborting." -ForegroundColor Red
        if (-not $KeepLocalStaging) { Remove-Item -Recurse -Force $staging }
        exit 1
    }
}

# Upload zip to VPS
$remoteZip = Join-Path $APP_DIR $zipName
Write-Host "Uploading $zipPath -> ${VPS_USER}@${VPS_IP}:$remoteZip" -ForegroundColor Cyan
$scpCmd = "scp -i `"$SSH_KEY`" `"$zipPath`" ${VPS_USER}@${VPS_IP}:`"$remoteZip`""
$scpExit = cmd.exe /c $scpCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "scp failed (exit $LASTEXITCODE)." -ForegroundColor Red
    if (-not $KeepLocalStaging) { Remove-Item -Recurse -Force $staging }
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Upload complete. Running remote deploy script..." -ForegroundColor Green

# Build remote script to run (sent over stdin to bash -s to avoid CRLF shebang issues)
$remoteScript = @'
set -euo pipefail
APP_DIR="' + $APP_DIR + '"
ZIP_NAME="' + $zipName + '"
REMOTE_ZIP="$APP_DIR/$ZIP_NAME"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Unzip the payload (try unzip, fallback to python)
if command -v unzip >/dev/null 2>&1; then
  echo "Using unzip to extract $REMOTE_ZIP"
  unzip -o "$REMOTE_ZIP" -d "$APP_DIR"
else
  echo "unzip not found, trying python unzip"
  python3 - <<PYTHON
import zipfile, sys
with zipfile.ZipFile('$REMOTE_ZIP', 'r') as z:
    z.extractall('$APP_DIR')
PYTHON
fi

# Apply SSL nginx config if present
if [ -f "$APP_DIR/nginx-ssl.conf" ]; then
  echo "Applying SSL nginx config"
  cp -f "$APP_DIR/nginx-ssl.conf" "$APP_DIR/nginx.conf"
fi

# Ensure permissions (set owner to current user)
chown -R $(whoami):$(whoami) "$APP_DIR" || true

# Check memory and create swap if needed (helps on 1GB VPS)
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo || echo 0)
CREATED_SWAP=0
if [ "$MEM_MB" -lt 2000 ]; then
  echo "Remote RAM ${MEM_MB}MB < 2000MB — creating 2GB swap"
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  CREATED_SWAP=1
fi

# Full from-scratch build and recreate
sudo docker compose down --remove-orphans --rmi all || true
sudo docker builder prune -af || true
# Build with BuildKit, no cache and pull latest base images
sudo sh -c 'COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build --no-cache --pull --progress=plain'
sudo docker compose up -d --force-recreate --renew-anon-volumes

# Remove temporary swap if created
if [ "$CREATED_SWAP" -eq 1 ]; then
  echo "Removing temporary swap"
  sudo swapoff /swapfile || true
  sudo rm -f /swapfile || true
fi

echo "REMOTE_DEPLOY_DONE"
'@

# Pipe the remote script to ssh (avoid writing a remote file with wrong CRLF)
$remoteScript | ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'bash -s'
$sshExit = $LASTEXITCODE

if ($sshExit -ne 0) {
    Write-Host "Remote deploy script failed (exit $sshExit)." -ForegroundColor Red
    if (-not $KeepLocalStaging) { Remove-Item -Recurse -Force $staging }
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Remote deploy completed successfully." -ForegroundColor Green

# Cleanup local artifacts
if (-not $KeepLocalStaging) {
    Write-Host "Removing local staging folder..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
}
Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

Write-Host "ZIP deploy finished. Your app should be live (check logs on VPS if needed)." -ForegroundColor Green
Write-Host "To tail logs on the VPS: ssh -i $SSH_KEY ${VPS_USER}@${VPS_IP} 'cd $APP_DIR; sudo docker compose logs -f'" -ForegroundColor Yellow

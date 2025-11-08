#!/usr/bin/env pwsh
# Deployment Pre-Check Script

Write-Host "=== Deployment Pre-Check ===" -ForegroundColor Cyan

# Check required directories
$requiredDirs = @("app", "components", "lib", "models", "types")
$optionalDirs = @("public", "mongo-init")
$allGood = $true

Write-Host "`nChecking Required Directories:" -ForegroundColor Yellow
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem -Path $dir -Recurse -File).Count
        Write-Host "  [OK] $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $dir MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host "`nChecking Optional Directories:" -ForegroundColor Yellow
foreach ($dir in $optionalDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem -Path $dir -Recurse -File).Count
        Write-Host "  [OK] $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] $dir (not found)" -ForegroundColor Gray
    }
}

# Check required files
$requiredFiles = @(
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "Dockerfile",
    "docker-compose.yml"
)

Write-Host "`nChecking Required Files:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  [OK] $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $file MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

# Check for common issues
Write-Host "`nChecking for Common Issues:" -ForegroundColor Yellow

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "  [INFO] .env.local found (will NOT be uploaded)" -ForegroundColor Cyan
}

# Check docker-compose.yml for version field
if (Test-Path "docker-compose.yml") {
    $dockerComposeContent = Get-Content "docker-compose.yml" -Raw
    if ($dockerComposeContent -match "version:\s*") {
        Write-Host "  [WARN] docker-compose.yml contains 'version' field" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] docker-compose.yml is clean" -ForegroundColor Green
    }
}

# Check for node_modules
if (Test-Path "node_modules") {
    Write-Host "  [INFO] node_modules found (will be ignored)" -ForegroundColor Cyan
}

# Calculate total size
Write-Host "`nEstimating Upload Size:" -ForegroundColor Yellow
$totalSize = 0
foreach ($dir in ($requiredDirs + $optionalDirs)) {
    if (Test-Path $dir) {
        $dirSize = (Get-ChildItem -Path $dir -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $totalSize += $dirSize
    }
}
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "  Total: $totalSizeMB MB" -ForegroundColor Cyan

# Show summary
Write-Host ""
if ($allGood) {
    Write-Host "[SUCCESS] Pre-check PASSED - Ready to deploy!" -ForegroundColor Green
    Write-Host "`nTo deploy, run:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1          # Full deployment" -ForegroundColor White
    Write-Host "  .\quick-deploy.ps1    # Quick update" -ForegroundColor White
} else {
    Write-Host "[FAILED] Pre-check FAILED - Fix issues above!" -ForegroundColor Red
    exit 1
}

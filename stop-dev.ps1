#!/usr/bin/env pwsh
# Stop development environment

Write-Host "=== Stopping isy.healthcare Development Environment ===" -ForegroundColor Yellow

if (Test-Path "docker-compose.dev.yml") {
    docker compose -f docker-compose.dev.yml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDevelopment environment stopped successfully!" -ForegroundColor Green
        
        Write-Host "`nTo remove volumes (WARNING: This will delete all data):" -ForegroundColor Yellow
        Write-Host "  docker compose -f docker-compose.dev.yml down -v" -ForegroundColor White
    } else {
        Write-Host "`nFailed to stop development environment!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Error: docker-compose.dev.yml not found!" -ForegroundColor Red
    Write-Host "Run dev.ps1 first to create the development environment." -ForegroundColor Yellow
    exit 1
}
"@

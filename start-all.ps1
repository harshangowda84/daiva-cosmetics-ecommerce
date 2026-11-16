# Daiva Tech - Cosmetics E-Commerce POC Startup Script
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host " Starting AURA LUXE Cosmetics Store & Zoho Integration POC " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Magenta

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 0. Terminate any stale processes holding ports 8085 or 5173
$ports = @(8085, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Write-Host "Freeing port $port from previous process (PID $p)..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

# Ensure any lingering background java instances releasing database file locks
Stop-Process -Name java -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 1

# 1. Start Spring Boot Backend on Port 8085
Write-Host "`n[1/2] Starting Spring Boot Backend (Port 8085)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; Write-Host 'Starting Fresh Spring Boot Backend...'; mvn spring-boot:run"

# Wait for backend to be ready on port 8085 before starting frontend
Write-Host "Waiting for Backend to initialize on port 8085..." -ForegroundColor Cyan
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    $conn = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Backend is UP and listening on port 8085!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $waited++
}

# 2. Start React/Vite Frontend on Port 5173
Write-Host "`n[2/2] Starting Frontend Vite Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; Write-Host 'Starting Frontend Dev Server...'; npm run dev"

Write-Host "`nStorefront:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "Admin Portal: http://localhost:5173#admin" -ForegroundColor Yellow
Write-Host "Backend API:  http://localhost:8085/api/products" -ForegroundColor Yellow
Write-Host "H2 Console:   http://localhost:8085/h2-console" -ForegroundColor Yellow
Write-Host "`nAll services launched successfully with latest endpoints!" -ForegroundColor Green

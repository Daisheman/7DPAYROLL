# Profacc Payroll — Local Development Startup Script
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1

$ErrorActionPreference = "Stop"

# Check Docker
try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: Docker is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "Starting local Postgres..." -ForegroundColor Cyan
docker compose up -d postgres

Write-Host "Waiting for Postgres..." -ForegroundColor Cyan
$retries = 0
while ($retries -lt 20) {
    try {
        docker compose exec -T postgres pg_isready -U payroll 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    Start-Sleep -Seconds 1
    $retries++
}

Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
npm --workspace apps/api run prisma:generate

Write-Host "Applying database migrations..." -ForegroundColor Cyan
npm --workspace apps/api run prisma:deploy

Write-Host "Running enhance migration if needed..." -ForegroundColor Cyan
# Apply the enhancement migration SQL directly
$sqlFile = "apps\api\prisma\migrations\20260604120000_enhance_payroll\migration.sql"
if (Test-Path $sqlFile) {
    Get-Content $sqlFile | docker compose exec -T postgres psql -U payroll -d payroll 2>&1
}

Write-Host "Seeding 7D Minerals data..." -ForegroundColor Cyan
npm run db:seed

Write-Host ""
Write-Host "Local payroll is starting:" -ForegroundColor Green
Write-Host "  Web: http://localhost:3000" -ForegroundColor White
Write-Host "  API: http://localhost:4000/api/docs" -ForegroundColor White
Write-Host ""

npm run dev

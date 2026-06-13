# Profacc Payroll — Apply all fixes
# Run from repo root: .\scripts\apply-fixes.ps1

Write-Host "=== Profacc Payroll — Applying Build Fixes ===" -ForegroundColor Cyan

# Step 1: Clean old dist to avoid stale import.meta artifacts
Write-Host "`n[1/5] Cleaning stale schema dist..." -ForegroundColor Yellow
if (Test-Path "packages\schemas\dist") { Remove-Item -Recurse -Force "packages\schemas\dist" }

# Step 2: Build schemas package
Write-Host "[2/5] Building @payroll/schemas..." -ForegroundColor Yellow
npm --workspace packages/schemas run build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: schemas build" -ForegroundColor Red; exit 1 }

# Step 3: Generate Prisma client
Write-Host "[3/5] Generating Prisma client..." -ForegroundColor Yellow
npm --workspace apps/api run prisma:generate
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: prisma generate" -ForegroundColor Red; exit 1 }

# Step 4: Build API
Write-Host "[4/5] Building API..." -ForegroundColor Yellow
npm --workspace apps/api run build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: API build" -ForegroundColor Red; exit 1 }

# Step 5: Build web (Next.js)
Write-Host "[5/5] Building Web..." -ForegroundColor Yellow
npm --workspace apps/web run build
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: Web build" -ForegroundColor Red; exit 1 }

Write-Host "`n=== All builds successful! ===" -ForegroundColor Green
Write-Host "To start locally:" -ForegroundColor Cyan
Write-Host "  Terminal 1: npm --workspace apps/api run start:local"
Write-Host "  Terminal 2: npm --workspace apps/web run dev"

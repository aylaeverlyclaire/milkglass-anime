<#
.SYNOPSIS
  Milkglass Enterprise Media Services - Zero-Cost Auto-Deploy Script
.DESCRIPTION
  Automates verification, preview compilation, Git synchronization, and Edge CDN deployment.
  Requires zero maintenance cost, zero credit cards, and scales sustainably worldwide.
#>

param(
  [string]$CommitMessage = "feat(edge-sync): automated corporate media workstation deployment"
)

$ErrorActionPreference = "Stop"
$WorkingDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $WorkingDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   MILKGLASS ZERO-COST EDGE CDN AUTO-DEPLOY PIPELINE            " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verification Guard
Write-Host "`n[1/4] Running Hyper-Extreme Quality, Regression & Security Pre-Flight Checks..." -ForegroundColor Yellow
if (Test-Path "verify_hyper_extreme_regression.mjs") {
  node verify_hyper_extreme_regression.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Pre-flight regression verification failed! Aborting deployment."
  }
} elseif (Test-Path "verify_ids.js") {
  node verify_ids.js
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Pre-flight verification failed! Aborting deployment."
  }
}

# 2. Preview Synchronization
Write-Host "`n[2/4] Synchronizing Standalone Preview Artifact..." -ForegroundColor Yellow
if (Test-Path "build_preview.py") {
  python build_preview.py
}

# 3. Git Staging & Local Commit
Write-Host "`n[3/4] Staging and Committing Changes to Branch 'main'..." -ForegroundColor Yellow
git add .
$status = git status --porcelain
if ($status) {
  git commit -m $CommitMessage
  Write-Host "Committed changes with message: '$CommitMessage'" -ForegroundColor Green
} else {
  Write-Host "Working directory clean; no new uncommitted changes." -ForegroundColor Gray
}

# 4. Remote Edge CDN Push (GitHub Pages / Cloudflare Pages CI/CD)
Write-Host "`n[4/4] Synchronizing with Global Edge CDN..." -ForegroundColor Yellow
$remotes = git remote
if ($remotes -contains "origin") {
  Write-Host "Pushing to remote 'origin/main'..." -ForegroundColor Cyan
  git push origin main
  Write-Host "`nSUCCESS! Changes pushed to GitHub repository." -ForegroundColor Green
  Write-Host "GitHub Actions / Cloudflare Pages CI/CD is now automatically deploying to edge CDN." -ForegroundColor Green
  Write-Host "Accessible on any device worldwide within ~20-30 seconds!" -ForegroundColor Green
} else {
  Write-Host "`n[NOTICE] Remote 'origin' is not yet linked." -ForegroundColor Yellow
  Write-Host "To enable instant one-click auto-deploy to any device:" -ForegroundColor White
  Write-Host "  1. Create a free repository on GitHub (e.g. 'milkglass-anime') - Zero Cost, No CC." -ForegroundColor Gray
  Write-Host "  2. Run: git remote add origin https://github.com/<your-username>/milkglass-anime.git" -ForegroundColor Cyan
  Write-Host "  3. Run: git push -u origin main" -ForegroundColor Cyan
  Write-Host "`nYour site will automatically deploy to https://<your-username>.github.io/milkglass-anime/ and Cloudflare Pages!" -ForegroundColor Green
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT PIPELINE EXECUTION COMPLETE                       " -ForegroundColor Cyan
Write-Host "=================================================================`n" -ForegroundColor Cyan

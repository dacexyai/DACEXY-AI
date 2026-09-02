$ErrorActionPreference = "Stop"
$desktop = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $desktop
Write-Host "DACEXY AI - Direct OpenClaw launcher" -ForegroundColor Cyan
if (-not (Test-Path ".\package.json")) { throw "desktop package.json is missing" }
if (-not (Test-Path ".\node_modules\vite\bin\vite.js")) {
  Write-Host "Installing DACEXY desktop dependencies..." -ForegroundColor Yellow
  npm install --no-audit --no-fund
}
Write-Host "Building DACEXY renderer..." -ForegroundColor Yellow
npm run build
if (-not (Test-Path ".\dist\index.html")) { throw "Renderer build did not produce dist\index.html" }
$electronExe = Join-Path $desktop "node_modules\electron\dist\electron.exe"
if (-not (Test-Path $electronExe)) {
  $cacheRoot = Join-Path $env:LOCALAPPDATA "electron\Cache"
  $zip = Get-ChildItem $cacheRoot -Recurse -Filter "electron-v33.2.0-win32-x64.zip" -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $zip) { $zip = Get-ChildItem $cacheRoot -Recurse -Filter "electron-v*-win32-x64.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 }
  if ($zip) {
    $distDir=Join-Path $desktop "node_modules\electron\dist"
    Remove-Item $distDir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force $distDir | Out-Null
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $distDir -Force
  }
}
if (-not (Test-Path $electronExe)) { throw "Electron executable is unavailable. Run npm install electron@33.2.0 on this machine." }
Write-Host "Launching DACEXY AI -> OpenClaw 127.0.0.1:18789" -ForegroundColor Green
& $electronExe $desktop --enable-logging

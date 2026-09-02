$ErrorActionPreference = 'Stop'

if (-not $env:DACEXY_API_URL) {
    throw 'DACEXY_API_URL is required. Example: https://api.example.com'
}
if ($env:DACEXY_API_URL -match 'localhost|127\.0\.0\.1') {
    throw 'DACEXY_API_URL must be a production HTTPS endpoint, not localhost/loopback.'
}

$desktop = Join-Path $PSScriptRoot 'fe\dacexy\desktop'
Push-Location $desktop
try {
    $env:VITE_API_URL = $env:DACEXY_API_URL
    Write-Host "Building untouched desktop agent with VITE_API_URL=$env:VITE_API_URL" -ForegroundColor Cyan
    npm ci
    npm run build
    Write-Host 'Desktop production build completed. No desktop agent source files were modified.' -ForegroundColor Green
} finally {
    Pop-Location
}

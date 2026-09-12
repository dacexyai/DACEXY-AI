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
    Write-Host 'Desktop production build completed.' -ForegroundColor Green
    Write-Host 'Packaging DACEXY AI Windows app with the embedded silent agent installer...' -ForegroundColor Cyan
    npm run package
    Write-Host 'Windows app package created under fe\\dacexy\\desktop\\release.' -ForegroundColor Green
    $makensis = Get-Command makensis.exe -ErrorAction SilentlyContinue
    if ($makensis) {
        Push-Location $desktop
        try {
            & $makensis.Source "-DSRCDIR=release\\DACEXY AI-win32-x64" "-DOUTFILE=release\\DACEXY-AI-Setup.exe" "installer.nsi"
            if ($LASTEXITCODE -ne 0) { throw "NSIS installer build failed." }
            Write-Host 'DACEXY-AI-Setup.exe created.' -ForegroundColor Green
        } finally { Pop-Location }
    } else {
        Write-Warning 'makensis.exe not found; packaged app is ready, but the final Setup.exe must be produced with NSIS on Windows.'
    }
} finally {
    Pop-Location
}

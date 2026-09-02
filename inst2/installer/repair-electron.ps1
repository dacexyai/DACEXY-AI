$ErrorActionPreference='Stop'
$desktop = Resolve-Path (Join-Path $PSScriptRoot '..\..\fe\dacexy\desktop')
$electronDir = Join-Path $desktop 'node_modules\electron'
$dist = Join-Path $electronDir 'dist'
$exe = Join-Path $dist 'electron.exe'
$version='33.2.0'
$zip=Join-Path $env:TEMP "electron-v$version-win32-x64.zip"
if (Test-Path $exe) { Write-Host "Electron OK: $exe" -ForegroundColor Green; exit 0 }
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$url="https://github.com/electron/electron/releases/download/v$version/electron-v$version-win32-x64.zip"
Write-Host "Downloading Electron $version directly..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
$tmp=Join-Path $env:TEMP "dacexy-electron-$version"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive $zip -DestinationPath $tmp -Force
Copy-Item (Join-Path $tmp '*') $dist -Recurse -Force
Remove-Item $tmp,$zip -Recurse -Force -ErrorAction SilentlyContinue
if (-not (Test-Path $exe)) { throw "Electron repair failed: electron.exe not found after direct download." }
Write-Host "Electron repaired: $exe" -ForegroundColor Green

$ErrorActionPreference = "Stop"
$desktop = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $desktop

$packaged = Join-Path $desktop "release\DACEXY AI-win32-x64"
if (-not (Test-Path (Join-Path $packaged "DACEXY AI.exe"))) {
    throw "Electron package not found. Run: npm run build && npx electron-packager . 'DACEXY-AI' --platform=win32 --arch=x64 --out=release --overwrite --extra-resource=installer"
}

$makensis = Get-Command makensis.exe -ErrorAction SilentlyContinue
if (-not $makensis) {
    $candidates = @(
        "$env:ProgramFiles\NSIS\makensis.exe",
        "${env:ProgramFiles(x86)}\NSIS\makensis.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates.Count -gt 0) { $makensis = @{ Source = $candidates[0] } }
}
if (-not $makensis) {
    throw "NSIS was not found. Install NSIS on this Windows build machine, then run npm run package:windows again."
}

$out = Join-Path $desktop "release\DACEXY-AI-Setup.exe"
& $makensis.Source "-DSRCDIR=$packaged" "-DOUTFILE=$out" (Join-Path $desktop "installer.nsi")
if ($LASTEXITCODE -ne 0) { throw "NSIS failed with exit code $LASTEXITCODE." }

if (-not (Test-Path $out)) { throw "NSIS completed but the installer was not created: $out" }
$size = (Get-Item $out).Length
if ($size -lt 5MB) { throw "Generated installer is suspiciously small ($size bytes). Refusing to report a broken installer as successful." }

Write-Host "DACEXY installer created:"
Write-Host $out
Write-Host ("Size: {0:N0} bytes" -f $size)

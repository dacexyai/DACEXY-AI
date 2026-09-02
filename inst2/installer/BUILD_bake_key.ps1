$ErrorActionPreference = "Stop"
Write-Host "DACEXY release installers are key-free. No provider API key is embedded." -ForegroundColor Yellow
if ($env:DACEXY_DEEPSEEK_API_KEY) { Write-Host "A provider key is available in the environment for a local/private test only; it is never written to installer source." -ForegroundColor Green }
exit 0

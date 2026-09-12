$ErrorActionPreference = 'SilentlyContinue'
$gatewayPort = 18789
$openclaw = Join-Path $env:LOCALAPPDATA 'DACEXY\npm-global\openclaw.cmd'
if (-not (Test-Path $openclaw)) { $openclaw = (Get-Command openclaw -ErrorAction SilentlyContinue).Source }
function Port-Up([int]$p) { try { return (Test-NetConnection 127.0.0.1 -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded } catch { return $false } }
if (-not (Port-Up $gatewayPort) -and $openclaw) { & $openclaw gateway restart | Out-Null }

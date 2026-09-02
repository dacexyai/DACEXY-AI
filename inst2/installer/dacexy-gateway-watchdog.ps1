$ErrorActionPreference = 'SilentlyContinue'
$port = 18789
$taskName = 'OpenClaw Gateway'
$gatewayCmd = Join-Path $env:USERPROFILE '.openclaw\gateway.cmd'
$logDir = Join-Path $env:LOCALAPPDATA 'DACEXY\logs'
$logFile = Join-Path $logDir 'gateway-watchdog.log'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
function Log($m) { try { Add-Content -Path $logFile -Value ("{0} {1}" -f (Get-Date -Format o),$m) } catch {} }
function PortUp { try { return (Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded } catch { return $false } }
function WaitForPort([int]$seconds) {
  $end = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $end) { if (PortUp) { return $true }; Start-Sleep -Seconds 2 }
  return (PortUp)
}
function StartGateway {
  if (PortUp) { return $true }
  try { Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue; Log 'requested scheduled Gateway task start' } catch {}
  if (WaitForPort 20) { Log 'Gateway recovered via scheduled task'; return $true }
  if (Test-Path $gatewayCmd) {
    try {
      Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c',('"{0}"' -f $gatewayCmd)) -WorkingDirectory (Split-Path $gatewayCmd) -WindowStyle Hidden
      Log 'requested direct gateway.cmd start'
    } catch { Log ('direct gateway.cmd start failed: ' + $_.Exception.Message) }
  }
  if (WaitForPort 25) { Log 'Gateway recovered via direct gateway.cmd'; return $true }
  Log 'Gateway still unhealthy after recovery attempts'
  return $false
}
while ($true) {
  try {
    if (-not (PortUp)) { [void](StartGateway); Start-Sleep -Seconds 3 } else { Start-Sleep -Seconds 5 }
  } catch { Log ('watchdog error: ' + $_.Exception.Message); Start-Sleep -Seconds 5 }
}

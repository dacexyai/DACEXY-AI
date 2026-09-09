$ErrorActionPreference = "SilentlyContinue"
$gatewayWatchdogTask = "DACEXY OpenClaw Gateway Watchdog"
& schtasks.exe /End /TN $gatewayWatchdogTask 2>$null | Out-Null
& schtasks.exe /Delete /TN $gatewayWatchdogTask /F 2>$null | Out-Null
& schtasks.exe /End /TN "OpenClaw Gateway Watchdog" 2>$null | Out-Null
& schtasks.exe /Delete /TN "OpenClaw Gateway Watchdog" /F 2>$null | Out-Null
& schtasks.exe /End /TN "DACEXY OpenClaw Compatibility Bridge" 2>$null | Out-Null
& schtasks.exe /Delete /TN "DACEXY OpenClaw Compatibility Bridge" /F 2>$null | Out-Null
& schtasks.exe /End /TN "DACEXY Bridge Watchdog" 2>$null | Out-Null
& schtasks.exe /Delete /TN "DACEXY Bridge Watchdog" /F 2>$null | Out-Null
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -and ($_.CommandLine -like "*dacexy-gateway-bridge.cjs*" -or $_.CommandLine -like "*dacexy-bridge-runner.cjs*") } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$openclaw = Get-Command openclaw -ErrorAction SilentlyContinue
if ($openclaw) { & $openclaw.Source gateway stop 2>$null | Out-Null; & $openclaw.Source gateway uninstall 2>$null | Out-Null }
Write-Host "DACEXY/OpenClaw runtime removed." -ForegroundColor Green

$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$tasks=@('OpenClaw Gateway','DACEXY OpenClaw Gateway Watchdog')
foreach($t in $tasks){ $x=Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue; Write-Host "$t : $($x.State)" }
foreach($p in 18789){ $x=Test-NetConnection 127.0.0.1 -Port $p -WarningAction SilentlyContinue; Write-Host "Port $p : $($x.TcpTestSucceeded)" }
$legacy=Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {$_.TaskName -match 'DACEXY.*Bridge|Compatibility Bridge'}
if($legacy){ throw 'Legacy DACEXY bridge scheduled tasks still exist.' }
Write-Host 'DIRECT OPENCLAW AUDIT PASS' -ForegroundColor Green

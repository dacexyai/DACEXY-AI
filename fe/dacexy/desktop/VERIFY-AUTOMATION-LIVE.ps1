$ErrorActionPreference = 'Stop'
Write-Host 'DACEXY automation live verification' -ForegroundColor Cyan
$oc = Get-Command openclaw -ErrorAction Stop
Write-Host "OpenClaw: $($oc.Source)"
$help = & openclaw automations --help 2>&1
if ($LASTEXITCODE -ne 0) { $help = & openclaw cron --help 2>&1; if ($LASTEXITCODE -ne 0) { throw 'No OpenClaw automation scheduler is available.' } }
Write-Host 'Scheduler command: PASS' -ForegroundColor Green
$stamp = [DateTimeOffset]::Now.AddMinutes(1).ToString('o')
$name = "DACEXY-LIVE-VERIFY-$([guid]::NewGuid().ToString('N').Substring(0,8))"
$out = & openclaw automations create $stamp "Reply exactly: DACEXY_AUTOMATION_E2E_OK" --name $name --agent main --session isolated --no-deliver --thinking off --json 2>&1
if ($LASTEXITCODE -ne 0) { $out = & openclaw cron add --at $stamp --message "Reply exactly: DACEXY_AUTOMATION_E2E_OK" --name $name --agent main --session isolated --json 2>&1 }
if ($LASTEXITCODE -ne 0) { throw "Automation creation failed: $out" }
$job = $out | ConvertFrom-Json
$id = [string]$job.id
if (-not $id) { $id = [string]$job.jobId }
if (-not $id -and $job.job) { $id = [string]$job.job.id }
if (-not $id -and $job.job) { $id = [string]$job.job.jobId }
if (-not $id) { throw "Automation created but no job id was returned: $out" }
try {
  $run = & openclaw automations run $id --wait --wait-timeout 3m --json 2>&1
  if ($LASTEXITCODE -ne 0) { $run = & openclaw cron run $id --wait --wait-timeout 3m --json 2>&1 }
  if ($LASTEXITCODE -ne 0) { throw "Automation run failed: $run" }
  $text = [string]$run
  if ($text -notmatch 'DACEXY_AUTOMATION_E2E_OK') { throw "Automation ran but expected result marker was not observed: $text" }
  Write-Host 'Live automation execution: PASS' -ForegroundColor Green
} finally {
  & openclaw automations remove $id --json 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { & openclaw cron remove $id --json 2>&1 | Out-Null }
}
Write-Host 'LIVE AUTOMATION E2E: PASS' -ForegroundColor Green

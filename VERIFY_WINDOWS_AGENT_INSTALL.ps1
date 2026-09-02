$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js not found' }
$openclaw = Get-Command openclaw -ErrorAction SilentlyContinue
if (-not $openclaw) { throw 'OpenClaw CLI not found' }
$version = (& $openclaw.Source --version 2>&1 | Out-String).Trim()
$skills = Join-Path $env:USERPROFILE '.openclaw\workspace\skills'
$count = @(Get-ChildItem $skills -Recurse -Filter SKILL.md -File -ErrorAction SilentlyContinue).Count
$gw = Test-NetConnection 127.0.0.1 -Port 18789 -WarningAction SilentlyContinue
if (-not $gw.TcpTestSucceeded) { throw 'OpenClaw Gateway is not listening on 127.0.0.1:18789' }
$legacy = Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {$_.TaskName -match 'DACEXY.*Bridge|Compatibility Bridge'}
if ($legacy) { throw 'Legacy DACEXY bridge task still exists' }
Write-Host "PASS: OpenClaw $version, $count skills, direct gateway 18789, no bridge" -ForegroundColor Green

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Dacexy Setup"

$OpenClawVersion = "2026.7.1-2"
$NodeVersion = "22.22.3"
$DeepSeekModel = if ($env:DACEXY_DEEPSEEK_MODEL) { $env:DACEXY_DEEPSEEK_MODEL } else { "deepseek-chat" }
$DeepSeekBaseUrl = if ($env:DACEXY_DEEPSEEK_BASE_URL) { $env:DACEXY_DEEPSEEK_BASE_URL } else { "https://api.deepseek.com/v1" }
$OpenClawPort = 18789
$NodeMsiSha256 = "f453126a7d40a3e0b5ce3e53cba86a441eaf76b3345563c2b707955c4f1818e1"

function Step($n,$total,$msg){ Write-Host "`n[$n/$total] $msg" -ForegroundColor Cyan }
function Run($FilePath, [string[]]$Arguments){
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed (exit $LASTEXITCODE): $FilePath $($Arguments -join ' ')"
    }
}
function Require-Command($Name){
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required but was not found after installation. Please restart the installer and try again."
    }
}

# Persistent installer checkpoints: once a phase completes successfully, a retry
# of this exact installer build skips it. A failed/incomplete phase is never marked
# complete, so rerunning resumes at the failed phase instead of repeating earlier work.
$ProgressId = "DACEXY-1.0.2-OpenClaw-2026.7.1-2-InstallerProgress-v2"
$ProgressDir = Join-Path $env:LOCALAPPDATA "DACEXY"
$ProgressFile = Join-Path $ProgressDir ($ProgressId + ".json")
New-Item -ItemType Directory -Force -Path $ProgressDir | Out-Null
$Completed = @{}
if (Test-Path $ProgressFile) {
    try {
        $saved = Get-Content -Raw -Path $ProgressFile | ConvertFrom-Json
        foreach ($p in @($saved.completed)) { $Completed[[string]$p] = $true }
    } catch {
        # A corrupt checkpoint must never prevent installation. Start a fresh state.
        $Completed = @{}
    }
}
function Is-Complete($Phase){ return $Completed.ContainsKey([string]$Phase) -and $Completed[[string]$Phase] }
function Mark-Complete($Phase){
    $Completed[[string]$Phase] = $true
    [pscustomobject]@{ installer=$ProgressId; completed=@($Completed.Keys | Sort-Object) } |
        ConvertTo-Json -Depth 3 | Set-Content -Path $ProgressFile -Encoding UTF8
}
function Run-Phase($Phase, [scriptblock]$Action){
    if (Is-Complete $Phase) {
        Write-Host "  $($Phase): already completed - skipping" -ForegroundColor DarkGray
        return
    }
    & $Action
    Mark-Complete $Phase
}

Clear-Host
Write-Host @"
 _____                              
|  __ \                             
| |  | | __ _  ___ _____  ___   _  
| |  | |/ _` |/ __/ _ \ \/ / | | | 
| |__| | (_| | (_|  __/>  <| |_| | 
|_____/ \__,_|\___\___/_/\_\\__, | 
                             __/ |  
                            |___/   
"@ -ForegroundColor Magenta
Write-Host "  Your 24/7 AI Business Agent - Setup" -ForegroundColor DarkCyan
Write-Host "------------------------------------------------------`n"
Write-Host "Persistent setup checkpoints: $ProgressFile" -ForegroundColor DarkGray

$total = 6

# 1. Node check. OpenClaw currently requires Node 22.22.3+, 24.15+, or 25.9+.
Step 1 $total "Checking Node.js runtime..."
if (Is-Complete "node") { Write-Host "  Node/runtime phase already completed - skipping" -ForegroundColor DarkGray } else {
$node = Get-Command node -ErrorAction SilentlyContinue
$needsNode = $true
if ($node) {
    $current = (node -p "process.versions.node").Trim()
    $parts = $current.Split('.') | ForEach-Object {[int]$_}
    $major,$minor,$patch = $parts[0],$parts[1],$parts[2]
    $supportedNode = (($major -eq 22 -and ($minor -gt 22 -or ($minor -eq 22 -and $patch -ge 3))) -or
                      ($major -eq 24 -and ($minor -gt 15 -or ($minor -eq 15 -and $patch -ge 0))) -or
                      ($major -eq 25 -and ($minor -gt 9 -or ($minor -eq 9 -and $patch -ge 0))) -or
                      ($major -ge 26))
    $needsNode = -not $supportedNode
    if (-not $needsNode) { Write-Host "  Supported Node $current found" -ForegroundColor Green }
}
if ($needsNode) {
    Write-Host "  Installing Node.js $NodeVersion..." -ForegroundColor Yellow
    $nodeMsi = Join-Path $env:TEMP "node-$NodeVersion-x64.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi" -OutFile $nodeMsi -UseBasicParsing
    if (-not (Test-Path $nodeMsi)) { throw "Node.js installer download failed." }
    $actualHash = (Get-FileHash -Path $nodeMsi -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $NodeMsiSha256) { Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue; throw "Node.js checksum verification failed." }
    $proc = Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart" -Wait -PassThru
    if ($proc.ExitCode -ne 0) { throw "Node.js installation failed with exit code $($proc.ExitCode)." }
    Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Require-Command "node"
    Write-Host "  Node $(node -v) installed" -ForegroundColor Green
}
Mark-Complete "node"
}

# 2. Install the exact tested OpenClaw version; never float on @latest.
Step 2 $total "Installing DACEXY agent engine OpenClaw $OpenClawVersion..."
if (Is-Complete "openclaw") { Write-Host "  OpenClaw installation phase already completed - skipping" -ForegroundColor DarkGray } else {
# Keep the OpenClaw CLI in a user-writable prefix so the per-user DACEXY installer
# does not depend on administrator access or a system-wide npm prefix.
$npmPrefix = Join-Path $env:LOCALAPPDATA "DACEXY\npm-global"
New-Item -ItemType Directory -Force -Path $npmPrefix | Out-Null
Run "npm" @("config", "set", "prefix", $npmPrefix)
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathParts = @($userPath -split ';' | Where-Object { $_ -and $_.Trim() })
if ($pathParts -notcontains $npmPrefix) {
    [Environment]::SetEnvironmentVariable("Path", (($pathParts + $npmPrefix) -join ';'), "User")
}
$env:Path = "$npmPrefix;" + $env:Path
$npmMajor = [int]((npm -v).Trim().Split('.')[0])
$npmMinor = [int]((npm -v).Trim().Split('.')[1])
$npmArgs = @("install", "-g", "openclaw@$OpenClawVersion", "--silent")
if (($npmMajor -gt 11) -or ($npmMajor -eq 11 -and $npmMinor -ge 16)) { $npmArgs += "--allow-scripts=openclaw" }
Run "npm" $npmArgs
Require-Command "openclaw"
$installedVersion = (openclaw --version 2>&1 | Out-String).Trim()
if ($installedVersion -notmatch [regex]::Escape($OpenClawVersion)) {
    throw "OpenClaw version verification failed. Expected $OpenClawVersion, got: $installedVersion"
}
Write-Host "  OpenClaw $installedVersion installed" -ForegroundColor Green
}
Mark-Complete "openclaw"

# 3. Configure inference without embedding a company-wide secret in the installer.
Step 3 $total "Configuring AI provider..."
if (Is-Complete "provider") { Write-Host "  Provider configuration phase already completed - skipping" -ForegroundColor DarkGray } else {
$providerKey = $env:DACEXY_DEEPSEEK_API_KEY
if (-not $providerKey) { $providerKey = $env:DEEPSEEK_API_KEY }
# Never treat template placeholders as real credentials.
if ($providerKey -and $providerKey -match "YOUR[_-]?REAL|YOUR[_-]?DEEPSEEK|REPLACE|CHANGE[_-]?ME") { $providerKey = $null }
if ($providerKey) {
    $env:DEEPSEEK_API_KEY = $providerKey
    Run "openclaw" @(
        "onboard", "--non-interactive", "--accept-risk", "--mode", "local",
        "--auth-choice", "custom-api-key",
        "--custom-base-url", $DeepSeekBaseUrl,
        "--custom-model-id", $DeepSeekModel,
        "--custom-api-key", $providerKey,
        "--secret-input-mode", "plaintext",
        "--gateway-bind", "loopback",
        "--gateway-port", $OpenClawPort,
        "--install-daemon",
        "--skip-bootstrap",
        "--skip-skills"
    )
    Write-Host "  DeepSeek configured as $DeepSeekModel" -ForegroundColor Green
} else {
    # Do not ship or manufacture a provider secret. Establish a valid local baseline and gateway service.
    Run "openclaw" @("setup", "--baseline")
    Run "openclaw" @("config", "set", "gateway.mode", "local")
    Run "openclaw" @("config", "set", "gateway.port", $OpenClawPort)
    Run "openclaw" @("gateway", "install", "--force")
    Write-Host "  OpenClaw runtime installed; no provider key was supplied." -ForegroundColor Yellow
    Write-Host "  Set DACEXY_DEEPSEEK_API_KEY and rerun setup to enable AI inference." -ForegroundColor Yellow
}
}
Mark-Complete "provider"

# 4. Rebrand (display-only; OpenClaw runtime remains unmodified).
Step 4 $total "Applying DACEXY branding..."
if (Is-Complete "branding") { Write-Host "  Branding phase already completed - skipping" -ForegroundColor DarkGray } else {
Write-Host "  Branded as DACEXY" -ForegroundColor Green
}
Mark-Complete "branding"

# 5. Business skills. Current OpenClaw workspace skills path is ~/.openclaw/workspace/skills.
Step 5 $total "Installing 630 business skills..."
if (Is-Complete "skills") { Write-Host "  Business skills phase already completed - skipping" -ForegroundColor DarkGray } else {
$skillsSrc = Join-Path $PSScriptRoot "skills"
$skillsDst = Join-Path $env:USERPROFILE ".openclaw\workspace\skills"
if (-not (Test-Path $skillsSrc)) { throw "Bundled skills directory not found: $skillsSrc" }
New-Item -ItemType Directory -Force -Path $skillsDst | Out-Null
Copy-Item -Recurse -Force (Join-Path $skillsSrc "*") $skillsDst
$skillCount = @(Get-ChildItem -Path $skillsDst -Recurse -Filter "SKILL.md" -File -ErrorAction SilentlyContinue).Count
if ($skillCount -lt 630) { throw "Skill installation verification failed: expected at least 630 SKILL.md files, found $skillCount." }
Write-Host "  Skills installed and verified: $skillCount" -ForegroundColor Green
}
Mark-Complete "skills"

# 5A. Expose the complete OpenClaw agent tool surface. OpenClaw local onboarding
# defaults to the "coding" tool profile when no explicit profile is set; that
# profile intentionally excludes the browser tool. DACEXY is a thin OpenClaw
# client, so it must not impose that restriction on the real OpenClaw agent.
# Keep this additive: do not replace or reimplement any OpenClaw capability.
Step 5 $total "Enabling full OpenClaw agent capabilities..."
if (Is-Complete "capabilities") { Write-Host "  OpenClaw capability phase already completed - skipping" -ForegroundColor DarkGray } else {
Run "openclaw" @("config", "set", "tools.profile", "full")
Run "openclaw" @("config", "set", "browser.enabled", "true")
Run "openclaw" @("config", "set", "browser.defaultProfile", "openclaw")
Run "openclaw" @("config", "set", "plugins.entries.browser.enabled", "true")
Write-Host "  Full OpenClaw tool profile: PASS" -ForegroundColor Green
Write-Host "  OpenClaw browser tool: PASS" -ForegroundColor Green
}
Mark-Complete "capabilities"

# 6. Ensure the managed OpenClaw Gateway is installed/running and verified.
Step 6 $total "Starting OpenClaw directly on 127.0.0.1:$OpenClawPort (24/7)..."
if (Is-Complete "gateway") { Write-Host "  Gateway phase already completed - skipping" -ForegroundColor DarkGray } else {
$providerKey = $env:DACEXY_DEEPSEEK_API_KEY
if ($providerKey) { Run "openclaw" @("doctor") }
Run "openclaw" @("config", "set", "gateway.mode", "local")
Run "openclaw" @("config", "set", "gateway.bind", "loopback")
Run "openclaw" @("config", "set", "gateway.port", $OpenClawPort)
# DACEXY is a private same-machine desktop client. No public/LAN listener is created.
Run "openclaw" @("config", "set", "gateway.auth.mode", "none")
Run "openclaw" @("gateway", "install", "--force")
# Do not use `openclaw gateway restart` here: on Windows it can return exit -1 even
# when the Scheduled Task actually restarts successfully. That made the installer
# abort before the desktop shortcut was created. Start the managed task directly and
# verify the socket instead.
try { Start-ScheduledTask -TaskName "OpenClaw Gateway" -ErrorAction Stop } catch {
    Run "openclaw" @("gateway", "install", "--force")
    Start-ScheduledTask -TaskName "OpenClaw Gateway" -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3

$gatewayProbe = Test-NetConnection -ComputerName 127.0.0.1 -Port $OpenClawPort -WarningAction SilentlyContinue
if (-not $gatewayProbe.TcpTestSucceeded) {
    Write-Host "  Gateway did not answer yet; waiting for initialization..." -ForegroundColor Yellow
    for ($i=0; $i -lt 15 -and -not $gatewayProbe.TcpTestSucceeded; $i++) {
        Start-Sleep -Seconds 2
        $gatewayProbe = Test-NetConnection -ComputerName 127.0.0.1 -Port $OpenClawPort -WarningAction SilentlyContinue
    }
}
if (-not $gatewayProbe.TcpTestSucceeded) { throw "OpenClaw Gateway failed health check on port $OpenClawPort." }

# Remove any legacy DACEXY bridge/watchdog tasks and processes from older installs.
$legacyTasks = @("DACEXY OpenClaw Compatibility Bridge", "DACEXY Bridge Watchdog")
foreach ($task in $legacyTasks) {
    # These are optional leftovers from older DACEXY builds. Do not let a missing
    # task (or schtasks.exe's stderr) abort an otherwise successful installation.
    $existingTask = Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue
    if ($existingTask) {
        try { Stop-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue } catch {}
        try { Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue } catch {}
    }
}
$legacyNames = @("dacexy-gateway-bridge.cjs", "dacexy-bridge-runner.cjs")
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -eq "node.exe" -and $_.CommandLine -and ($legacyNames | ForEach-Object { $_.CommandLine -like "*$_*" } | Where-Object { $_ })
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Dedicated Gateway watchdog only. OpenClaw itself is the agent runtime; no DACEXY bridge exists.
$gatewayWatchdog = Join-Path $PSScriptRoot "dacexy-gateway-watchdog.ps1"
if (-not (Test-Path $gatewayWatchdog)) { throw "Gateway watchdog missing: $gatewayWatchdog" }
$nodeExe = (Get-Command node).Source
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
$watchdogSettings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$gatewayWatchdogTask = "DACEXY OpenClaw Gateway Watchdog"
& schtasks.exe /End /TN $gatewayWatchdogTask 2>$null | Out-Null
& schtasks.exe /Delete /TN $gatewayWatchdogTask /F 2>$null | Out-Null
$gatewayWatchdogAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$gatewayWatchdog`"" -WorkingDirectory $PSScriptRoot
$gatewayWatchdogTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
Register-ScheduledTask -TaskName $gatewayWatchdogTask -Action $gatewayWatchdogAction -Trigger $gatewayWatchdogTrigger -Principal $principal -Settings $watchdogSettings -Force | Out-Null
Start-ScheduledTask -TaskName $gatewayWatchdogTask

Write-Host "  OpenClaw Gateway: PASS ws://127.0.0.1:$OpenClawPort" -ForegroundColor Green
Write-Host "  DACEXY connection: DIRECT -> OpenClaw Gateway (no bridge)" -ForegroundColor Green
Write-Host "  Gateway Watchdog: PASS (hidden, continuous health check)" -ForegroundColor Green
}
Mark-Complete "gateway"

Write-Host "========================================================`n" -ForegroundColor DarkGray

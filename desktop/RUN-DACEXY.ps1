$ErrorActionPreference = "Stop"
$desktop = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $desktop "START-DACEXY-FIXED.ps1")

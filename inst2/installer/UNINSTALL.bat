@echo off
title DACEXY AI Uninstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
echo DACEXY Agent runtime removed.
pause

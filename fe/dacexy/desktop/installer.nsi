; NSIS installer script for DACEXY AI
; Build:  makensis -DSRCDIR=<packaged app dir> -DOUTFILE=<path to DACEXY-AI-Setup.exe> installer.nsi

Unicode true
SetCompressor /SOLID lzma

!define APPNAME "DACEXY AI"
!define COMPANY "DACEXY"
!define VERSION "1.0.2"
!define EXENAME "DACEXY AI.exe"
!define REGKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\DACEXY AI"

!ifndef SRCDIR
  !define SRCDIR "release\DACEXY AI-win32-x64"
!endif
!ifndef OUTFILE
  !define OUTFILE "DACEXY-AI-Setup.exe"
!endif

Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\DACEXY AI"
InstallDirRegKey HKCU "Software\DACEXY AI" "InstallDir"
RequestExecutionLevel user
ShowInstDetails show
ShowUnInstDetails show
BrandingText "${COMPANY} · ${APPNAME} ${VERSION}"

VIProductVersion "1.0.2.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${COMPANY}"
VIAddVersionKey "FileDescription" "${APPNAME} Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "(c) ${COMPANY}"

!include "MUI2.nsh"
!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APPNAME}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${SRCDIR}\*.*"

  ; Bundle and run the real DACEXY runtime installer so one EXE provisions
  ; the local OpenClaw agent, skills, gateway and watchdog.
  !define INST2DIR "..\..\..\inst2"
  SetOutPath "$INSTDIR\inst2\installer"
  File /r "${INST2DIR}\installer\*.*"
  SetOutPath "$INSTDIR\inst2"
  File /r "${INST2DIR}\*.*"
  IfFileExists "$INSTDIR\inst2\installer\install.ps1" 0 runtime_missing
  DetailPrint "Installing DACEXY local agent runtime..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\inst2\installer\install.ps1"' $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP "DACEXY Agent runtime installation failed (exit code $0)."
    Abort
  ${EndIf}
  Goto runtime_done
  runtime_missing:
    MessageBox MB_ICONSTOP "DACEXY Agent runtime files are missing from this installer."
    Abort
  runtime_done:

  CreateDirectory "$SMPROGRAMS\DACEXY"
  CreateShortCut "$SMPROGRAMS\DACEXY\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0

  WriteRegStr HKCU "Software\DACEXY AI" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${REGKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${REGKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${REGKEY}" "Publisher" "${COMPANY}"
  WriteRegStr HKCU "${REGKEY}" "DisplayIcon" "$INSTDIR\${EXENAME}"
  WriteRegStr HKCU "${REGKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${REGKEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegDWORD HKCU "${REGKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${REGKEY}" "NoRepair" 1

  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\DACEXY\${APPNAME}.lnk"
  RMDir "$SMPROGRAMS\DACEXY"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${REGKEY}"
  DeleteRegKey HKCU "Software\DACEXY AI"
SectionEnd

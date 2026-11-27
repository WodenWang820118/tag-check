; Installs the bundled backend into an empty folder. An upgrade otherwise
; keeps node_modules files the new backend no longer has, and Node resolves
; them first: archiver 8's readdir-glob then loaded a stale nested minimatch 5
; and the backend exited at startup.
!macro NSIS_HOOK_PREINSTALL
  ; This hook runs before the installer's own check; close a running app first
  ; so its backend does not hold files open while the folder is removed.
  !insertmacro CheckIfAppIsRunning "$INSTDIR\${MAINBINARYNAME}.exe" "${PRODUCTNAME}"
  RMDir /r "$INSTDIR\backend"
!macroend

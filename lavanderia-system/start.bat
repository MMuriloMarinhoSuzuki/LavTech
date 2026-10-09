@echo off
setlocal
cd /d "%~dp0"
echo.
echo   Iniciando o Lavanderia System...
echo.
node scripts\start.mjs
if errorlevel 1 (
  echo.
  echo   Ocorreu um erro ao iniciar. Verifique se o Node.js 22+ esta instalado.
  echo.
  pause
)
endlocal

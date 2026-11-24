@echo off
title KAS WIFI Mobile - Server Launcher
color 0b
cls
echo ========================================================
echo       KAS WIFI MOBILE - PROJECT ARCELL
echo    Aplikasi Kasir ^& Pembukuan Kas WiFi RT/RW Net
echo ========================================================
echo.

cd /d "%~dp0"

if not exist node_modules call npm install

echo Sedang menjalankan server mobile (Vite)...
echo.
echo Server lokal: http://localhost:5173
echo.
call npm run dev

pause

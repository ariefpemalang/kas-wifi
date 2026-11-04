@echo off
title KAS WIFI Mobile - Server Launcher
color 0b
cls
echo ========================================================
echo       📶 KAS WIFI MOBILE - PROJECT ARCELL
echo    Aplikasi Kasir & Pembukuan Kas WiFi RT/RW Net
echo ========================================================
echo.
echo Sedang menyiapkan server mobile...
echo.

cd /d "%~dp0"
call npm run dev

pause

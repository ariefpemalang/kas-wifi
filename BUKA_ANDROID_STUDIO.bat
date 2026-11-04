@echo off
title Buka Proyek Android Studio - KAS WIFI Mobile
color 0a
cls
echo ========================================================
echo   Membuka Proyek Android Studio untuk Build APK Native
echo ========================================================
echo.

cd /d "%~dp0"
call npx cap open android

pause

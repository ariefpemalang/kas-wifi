@echo off
title KAS WIFI Mobile - Server Launcher
color 0b
cls
echo ========================================================
echo       📶 KAS WIFI MOBILE - PROJECT ARCELL
echo    Aplikasi Kasir ^& Pembukuan Kas WiFi RT/RW Net
echo ========================================================
echo.

cd /d "%~dp0"

:: Cek apakah dependencies node_modules sudah terinstall
if not exist "node_modules\" (
    echo [INFO] Mengunduh dependencies yang diperlukan (npm install)...
    echo Mohon tunggu sebentar...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Gagal menginstall dependencies npm!
        pause
        exit /b 1
    )
    echo [OK] Dependencies berhasil dipasang.
    echo.
)

echo Sedang menjalankan server mobile (Vite)...
echo.
call npm run dev

pause

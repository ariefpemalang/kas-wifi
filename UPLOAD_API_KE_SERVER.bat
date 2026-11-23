@echo off
title Upload API Kas WiFi ke Server Proxmox / Website
color 0b
cls
echo ========================================================
echo   UPLOAD FOLDER API KAS WIFI KE SERVER (LXC 2201)
echo ========================================================
echo.
echo Server Target : 192.168.66.18 (LXC 2201 / https://kaswifi.my.id)
echo File Target   : /var/www/html/api/index.php
echo.
set /p PASS=Masukkan password SSH root server: 

echo.
echo Sedang mengunggah file API ke server...
"C:\Program Files (x86)\WinSCP\WinSCP.com" /command ^
  "open sftp://root:%PASS%@192.168.66.18/ -hostkey=*" ^
  "option batch abort" ^
  "option confirm off" ^
  "mkdir /var/www/html/api" ^
  "put -overwrite ""%~dp0api\index.php"" ""/var/www/html/api/index.php""" ^
  "call chown -R www-data:www-data /var/www/html/api" ^
  "call chmod -R 755 /var/www/html/api" ^
  "exit"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUKSES] API berhasil diunggah ke server!
    echo Sekarang Mobile App dapat langsung tersinkronisasi.
    echo ========================================================
) else (
    echo.
    echo [INFO ALTERNATIF] Jika login SFTP ditolak, Anda dapat:
    echo 1. Buka Proxmox Web GUI (https://192.168.66.10:8006)
    echo 2. Buka Console LXC 2201 (kas-wifi)
    echo 3. Jalankan perintah:
    echo    mkdir -p /var/www/html/api
    echo    lalu salin file api/index.php ke folder tersebut.
)
echo.
pause

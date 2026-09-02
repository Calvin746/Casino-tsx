@echo off
title Online Casino Starter
echo ==========================================
echo       STARTE ONLINE CASINO...
echo ==========================================

echo [1/3] Starte Backend...
cd /d "%~dp0server"
start "Casino Backend" cmd /k "npm start"

echo [2/3] Starte Frontend...
cd /d "%~dp0client"
start "Casino Frontend" cmd /k "npm run dev"

echo [3/3] Oeffne Casino im Standard-Browser...
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000/

echo.
echo ==========================================
echo Fertig! Das Casino laeuft und wurde geoeffnet.
echo ==========================================
ping 127.0.0.1 -n 3 >nul

@echo off
cd /d "%~dp0"
title AI Project Companion

echo ========================================
echo   AI Project Companion
echo   http://127.0.0.1:8910
echo ========================================
echo.

:: Стартуем сервер в фоне
start /B "" python server.py > server.log 2>&1
timeout /t 2 /nobreak >nul

:: Открываем браузер
start "" "http://127.0.0.1:8910"
echo [OK] Браузер открыт. Закройте окно чтобы остановить сервер.
echo.

pause >nul
taskkill /f /im python.exe >nul 2>&1

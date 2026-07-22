@echo off
cd /d "%~dp0"
title AI Project Companion — http://127.0.0.1:8910

echo ========================================
echo   AI Project Companion
echo ========================================
echo [OK] Запуск сервера на 127.0.0.1:8910
echo.

:: Запускаем сервер в фоне, ждём, открываем браузер
start /B "" python -m http.server 8910
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8910"

echo [OK] Браузер открыт. Закройте окно чтобы остановить сервер.
echo [INFO] Если не загрузилось — обновите страницу в браузере
echo.

pause >nul
taskkill /f /im python.exe >nul 2>&1

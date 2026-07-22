@echo off
cd /d "%~dp0"
title AI Project Companion — http://localhost:8765

echo ========================================
echo   AI Project Companion
echo   http://localhost:8765
echo ========================================
echo [OK] Запуск сервера...

:: Стартуем сервер в фоне этого окна
start /B "" python server.py > server.log 2>&1

:: Ждём готовности
timeout /t 2 /nobreak >nul

:: Открываем браузер
start "" "http://localhost:8765"
echo [OK] Браузер открыт
echo [INFO] Закройте это окно чтобы остановить сервер
echo.

:: Держим окно открытым — сервер жив, пока открыто это окно
pause >nul

:: Останавливаем сервер при закрытии
taskkill /f /im python.exe >nul 2>&1

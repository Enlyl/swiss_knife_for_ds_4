@echo off
cd /d "%~dp0"
title AI Project Companion

echo ========================================
echo   AI Project Companion
echo ========================================
echo.

:: Открываем site напрямую (всегда работает)
start "" "index.html"

:: Если есть Python — запускаем сервер в отдельном окне
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Сервер: http://localhost:8765
    start "AI Server" /MIN python server.py
    timeout /t 2 /nobreak >nul
)

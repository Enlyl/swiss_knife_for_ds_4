@echo off
chcp 65001 >nul
title AI Project Companion

echo ========================================
echo   AI Project Companion — Data Science
echo ========================================
echo.

:: Проверяем Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Python не найден. Открываю index.html напрямую...
    start "" "index.html"
    exit /b
)

:: Запускаем сервер
echo [INFO] Запуск сервера на http://localhost:8765
echo [INFO] Нажмите Ctrl+C для остановки
echo.
start "" "http://localhost:8765"
python server.py

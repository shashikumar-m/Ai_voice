@echo off
title AI Voice Notes - Public Internet Access (ngrok)
color 0B

echo.
echo  ============================================
echo   AI Voice Notes - Public Access via ngrok
echo  ============================================
echo.
echo  REQUIREMENTS:
echo  1. ngrok installed: https://ngrok.com/download
echo  2. Free ngrok account + authtoken set
echo.
echo  If ngrok not installed, run:
echo    winget install ngrok
echo  Then:
echo    ngrok config add-authtoken YOUR_TOKEN
echo.
echo  ============================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] ngrok not found!
    echo  Install it from: https://ngrok.com/download
    echo  Or run: winget install ngrok
    pause
    exit /b 1
)

echo  [1/3] Starting Backend (FastAPI)...
start "Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 5 /nobreak > nul

echo  [2/3] Starting ngrok tunnel for backend (port 8000)...
start "ngrok - Backend" cmd /k "ngrok http 8000"
timeout /t 4 /nobreak > nul

echo.
echo  ============================================
echo  IMPORTANT - After ngrok starts:
echo.
echo  1. Look at the ngrok window
echo  2. Copy the https URL (e.g. https://abc123.ngrok.io)
echo  3. Edit website\.env.local and set:
echo     VITE_API_URL=https://abc123.ngrok.io/api
echo     VITE_WS_URL=wss://abc123.ngrok.io/api
echo  4. Then run: cd website && npm run dev
echo.
echo  Share the ngrok URL with anyone worldwide!
echo  ============================================
echo.
pause

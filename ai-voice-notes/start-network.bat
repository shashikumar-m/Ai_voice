@echo off
title AI Voice Notes - Network Server
color 0A

echo.
echo  ============================================
echo   AI Voice Notes - Network Server Launcher
echo  ============================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
    goto :found
)
:found
set LOCAL_IP=%LOCAL_IP: =%

echo  Your Local IP: %LOCAL_IP%
echo.
echo  Users on your WiFi can access:
echo  ----------------------------------------
echo   Website  : http://%LOCAL_IP%:5173
echo   API      : http://%LOCAL_IP%:8000
echo   API Docs : http://%LOCAL_IP%:8000/docs
echo  ----------------------------------------
echo.

REM Write the IP to frontend .env so it points to this machine
echo VITE_API_URL=http://%LOCAL_IP%:8000/api > "website\.env.local"
echo VITE_WS_URL=ws://%LOCAL_IP%:8000/api   >> "website\.env.local"
echo.
echo  [OK] Frontend configured to use: http://%LOCAL_IP%:8000/api
echo.

REM Start backend in new window
echo  [1/2] Starting Backend (FastAPI)...
start "AI Voice Notes - Backend" cmd /k "cd /d %~dp0backend && python main.py"

REM Wait for backend to start
timeout /t 4 /nobreak > nul

REM Start frontend in new window
echo  [2/2] Starting Frontend (React)...
start "AI Voice Notes - Frontend" cmd /k "cd /d %~dp0website && npm run dev"

echo.
echo  ============================================
echo   Both servers are starting...
echo   Share this with users on your WiFi:
echo.
echo   http://%LOCAL_IP%:5173
echo  ============================================
echo.
echo  Press any key to open the app in your browser...
pause > nul
start http://%LOCAL_IP%:5173

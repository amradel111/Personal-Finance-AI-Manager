@echo off
echo ============================================
echo  Personal Finance AI Manager
echo  Starting Development Servers...
echo ============================================
echo.

echo Starting ML Service (Port 5001)...
start "ML Service" cmd /k "cd /d "%~dp0ML model" && python app.py"

timeout /t 3 /nobreak >nul

echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm start"

timeout /t 2 /nobreak >nul

echo Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo  All Servers Started!
echo ============================================
echo  ML Service: http://localhost:5001
echo  Backend:    http://localhost:5000
echo  Frontend:   http://localhost:5173
echo ============================================
echo.

@echo off
echo =======================================================
echo    Starting Utkal Alumina IT Dashboard (Windows)
echo =======================================================

echo.
echo Installing dependencies (if missing)...
call npm install

echo.
echo Launching the IT Dashboard server...
echo The dashboard will be available at http://localhost:3001
echo.
echo Press Ctrl+C to stop the server at any time.
echo -------------------------------------------------------

REM Use call npm run dev to start the Next.js app natively on port 3001
call npm run dev -- -p 3001

pause

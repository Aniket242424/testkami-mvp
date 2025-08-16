@echo off
echo Starting Autosana Test Automation Platform...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting development servers...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.

call npm run dev

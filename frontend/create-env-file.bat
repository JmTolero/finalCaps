@echo off
echo ================================================
echo ChillNet - Creating .env file for Network Testing
echo ================================================
echo.

REM Get the IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :found
)

:found
REM Trim leading spaces
for /f "tokens=* delims= " %%a in ("%IP%") do set IP=%%a

echo Your computer's IP address is: %IP%
echo.
echo Creating .env file with API_URL=http://%IP%:3001
echo.

REM Create .env file
echo # API Configuration for ChillNet Frontend > .env
echo # >> .env
echo # This file configures the backend API URL >> .env
echo # Created automatically on %date% at %time% >> .env
echo. >> .env
echo REACT_APP_API_URL=http://%IP%:3001 >> .env

echo ================================================
echo .env file created successfully!
echo ================================================
echo.
echo NEXT STEPS:
echo 1. Restart your React development server (Ctrl+C and run 'npm start')
echo 2. Restart your backend server
echo 3. Access from other devices using: http://%IP%:3000
echo.
echo To test:
echo - On this computer: http://localhost:3000
echo - On other devices: http://%IP%:3000
echo.
pause


@echo off
echo 🔄 Restarting Backend Server...
echo.

echo 🛑 Stopping existing Node processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 📂 Navigating to backend directory...
cd backend

echo 🚀 Starting backend server...
echo ✅ Server will run on http://localhost:3001
echo 🔍 Test endpoint: http://localhost:3001/api/vendor/current
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

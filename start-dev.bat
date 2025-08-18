@echo off
REM Development startup script for ML Portfolio with FastAPI backend (Windows)

echo 🚀 Starting ML Portfolio Development Environment
echo ==============================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed.
    echo Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install backend dependencies
echo.
echo 📦 Setting up backend dependencies...
cd backend

if not exist "venv" (
    echo    Creating Python virtual environment...
    python -m venv venv
)

echo    Activating virtual environment...
call venv\Scripts\activate.bat

echo    Installing Python packages...
pip install -q -r requirements.txt

echo ✅ Backend setup complete

REM Start FastAPI backend in background
echo.
echo 🔧 Starting FastAPI backend on http://localhost:8000
start /b python main.py

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Go back to root and start frontend
cd ..
echo.
echo 📦 Installing frontend dependencies...
call npm install

echo.
echo 🎨 Starting Vite frontend on http://localhost:8080
start /b npm run dev

echo.
echo 🎉 Development environment is ready!
echo ==============================================
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all services...
pause >nul

REM Cleanup (basic - Windows doesn't have easy process management)
echo 🧹 Stopping services...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo 👋 Goodbye!
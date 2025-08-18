#!/bin/bash

# Development startup script for ML Portfolio with FastAPI backend

echo "🚀 Starting ML Portfolio Development Environment"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🧹 Cleaning up processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   Stopped FastAPI backend (PID: $BACKEND_PID)"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Stopped Vite frontend (PID: $FRONTEND_PID)"
    fi
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Install backend dependencies if needed
echo ""
echo "📦 Setting up backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing Python packages..."
pip install -q -r requirements.txt

echo "✅ Backend setup complete"

# Start FastAPI backend
echo ""
echo "🔧 Starting FastAPI backend on http://localhost:8000"
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    cleanup
fi

echo "✅ Backend is running (PID: $BACKEND_PID)"

# Go back to root and start frontend
cd ..
echo ""
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "🎨 Starting Vite frontend on http://localhost:8080"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Development environment is ready!"
echo "=============================================="
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
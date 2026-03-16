#!/bin/bash

# AI Interview Coach - Startup Script for Linux/Mac
# Run this from the Ai_powered_interview_coach directory

echo "🚀 Starting AI Interview Coach..."
echo "================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Ai_powered_interview_coach directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check ports
echo "🔍 Checking ports..."
check_port 8000 || echo "   Backend port 8000 is busy"
check_port 5173 || echo "   Frontend port 5173 is busy"

# Start Backend
echo ""
echo "🐍 Starting Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "   No virtual environment found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f ".deps_installed" ]; then
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# Start backend in background
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend started with PID: $BACKEND_PID"

# Go back to root directory
cd ..

# Start Frontend
echo ""
echo "⚛️  Starting Frontend (React)..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo "   Frontend started with PID: $FRONTEND_PID"

# Go back to root directory
cd ..

echo ""
echo "✅ Services Started Successfully!"
echo "================================="
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "🔄 Services are running. Waiting..."
wait
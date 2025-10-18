#!/bin/bash

# Resume Comparison Tool - Development Startup Script

echo "🚀 Starting Resume Comparison Tool..."
echo ""

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
  echo "❌ Error: backend/.env file not found"
  echo "Please create backend/.env with your OPENROUTER_API_KEY"
  exit 1
fi

# Start backend in background
echo "📦 Starting backend server (port 3001)..."
cd backend
bun run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server (port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo ""
echo "Backend PID: $BACKEND_PID (http://localhost:3001)"
echo "Frontend PID: $FRONTEND_PID (http://localhost:3000)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for interrupt signal
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait

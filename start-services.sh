#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting USDE Enterprise Platform..."

# Kill existing processes
echo "🔄 Killing existing processes..."
pkill -f "node.*backend" || true
pkill -f "react-scripts" || true

# Wait a moment for processes to terminate
sleep 2

# Start backend
echo "🔧 Starting backend server..."
cd "$SCRIPT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend application..."
cd "$SCRIPT_DIR/frontend" && npm start &
FRONTEND_PID=$!

echo "✅ Services started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5001"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 
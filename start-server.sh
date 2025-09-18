#!/bin/bash

# Start the development server
echo "Starting SwingVista development server..."
echo "Navigate to: http://localhost:3000/test-club-tracer"
echo ""

# Kill any existing processes
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start the server
cd /Users/ammrabbasher/swingvista
npm run dev


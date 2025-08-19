#!/bin/bash

echo "🚀 Starting Form Builder MERN Stack Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:6.0"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install-all
fi

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "🔧 Creating environment file..."
    cp backend/env.example backend/.env
    echo "   Please edit backend/.env with your configuration"
fi

# Create uploads directory
mkdir -p backend/uploads

echo "✅ Starting application..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Database: mongodb://localhost:27017/form-builder"
echo ""
echo "Press Ctrl+C to stop"

# Start both frontend and backend
npm run dev 
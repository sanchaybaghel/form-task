#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Form Builder MERN Stack Application${NC}"
echo -e "${YELLOW}----------------------------------${NC}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker and Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "🔧 Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}ℹ️  Please review the .env file and update the configuration if needed${NC}"
fi

# Function to start the application in development mode
start_dev() {
    echo -e "${GREEN}🚀 Starting in development mode...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi

    # Check if MongoDB is running
    if ! command -v mongod &> /dev/null; then
        echo "⚠️  MongoDB is not installed. Please install MongoDB first or use Docker."
        echo "   Using Docker: docker run -d -p 27017:27017 --name mongodb mongo:6.0"
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
        cd frontend && npm install && cd ..
        cd backend && npm install && cd ..
    fi

    # Create uploads directory
    mkdir -p backend/uploads

    echo -e "\n${GREEN}✅ Services starting...${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:5000${NC}"
    echo -e "   Database: ${GREEN}mongodb://localhost:27017/form-builder${NC}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}\n"

    # Start both frontend and backend
    npm run dev
}

# Function to start the application in production mode using Docker
start_prod() {
    echo -e "${GREEN}🚀 Starting in production mode with Docker Compose...${NC}"
    
    # Build and start containers
    docker-compose up --build -d
    
    echo -e "\n${GREEN}✅ Services started in detached mode${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:${FRONTEND_PORT:-3000}${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:${BACKEND_PORT:-5000}${NC}"
    echo -e "   Database: ${GREEN}mongodb://localhost:${MONGO_PORT:-27017}/${MONGO_INITDB_DATABASE:-form-builder}${NC}"
    echo -e "\n${YELLOW}To view logs: docker-compose logs -f${NC}"
    echo -e "${YELLOW}To stop: docker-compose down${NC}"
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker-compose down
    exit 0
}

# Function to display help
show_help() {
    echo -e "${GREEN}Usage: ./start.sh [command]${NC}"
    echo ""
    echo "Commands:"
    echo "  dev       Start in development mode (default)"
    echo "  prod      Start in production mode using Docker"
    echo "  stop      Stop all running containers"
    echo "  help      Show this help message"
    echo ""
    exit 0
}

# Handle command line arguments
case "$1" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_app
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ $# -eq 0 ]; then
            start_dev
        else
            echo -e "❌ Unknown command: $1"
            show_help
        fi
        ;;
esac 
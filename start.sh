#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Form Builder MERN Stack Application${NC}"
echo -e "${YELLOW}----------------------------------${NC}"

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker and Docker Compose are not installed. Please install them first.${NC}"
    exit 1
fi

# Prefer docker compose over docker-compose
DOCKER_COMPOSE_CMD="docker-compose"
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${BLUE}🔧 Creating .env file from example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}ℹ️  Please review the .env file and update the configuration if needed${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env.example found. Creating basic .env file...${NC}"
        create_basic_env
    fi
fi

# Function to create a basic .env file
create_basic_env() {
    cat > .env << EOF
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
MONGO_INITDB_DATABASE=form-builder
MONGO_PORT=27017

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Application Ports
FRONTEND_PORT=3000
BACKEND_PORT=4001
NGINX_PORT=80

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:3000,http://localhost

# Environment
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Basic .env file created${NC}"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Function to start the application in development mode
start_dev() {
    echo -e "${GREEN}🚀 Starting in development mode...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo -e "${YELLOW}⚠️  Node.js version is $NODE_VERSION. Recommended: 18+${NC}"
    fi

    # Check if MongoDB is running or available via Docker
    if ! command -v mongod &> /dev/null; then
        echo -e "${YELLOW}⚠️  MongoDB is not installed locally.${NC}"
        echo -e "${BLUE}   Starting MongoDB with Docker...${NC}"
        
        if ! docker run -d \
            --name form-builder-mongodb-dev \
            -p ${MONGO_PORT:-27017}:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME:-admin} \
            -e MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-password123} \
            mongo:6.0 > /dev/null 2>&1; then
            
            # Container might already exist
            docker start form-builder-mongodb-dev > /dev/null 2>&1
        fi
        
        echo -e "${GREEN}✅ MongoDB started in Docker${NC}"
    fi

    # Check if required ports are available
    FRONTEND_PORT=${FRONTEND_PORT:-3000}
    BACKEND_PORT=${BACKEND_PORT:-5000}
    
    if ! check_port $FRONTEND_PORT; then
        echo -e "${RED}❌ Port $FRONTEND_PORT is already in use${NC}"
        exit 1
    fi
    
    if ! check_port $BACKEND_PORT; then
        echo -e "${RED}❌ Port $BACKEND_PORT is already in use${NC}"
        exit 1
    fi

    # Install dependencies if needed
    install_dependencies

    # Create uploads directory
    mkdir -p backend/uploads

    echo -e "\n${GREEN}✅ Services starting...${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "   Database: ${GREEN}mongodb://localhost:${MONGO_PORT:-27017}/${MONGO_INITDB_DATABASE:-form-builder}${NC}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}\n"

    # Trap SIGINT to cleanup
    trap cleanup_dev INT
    
    # Start both frontend and backend
    npm run dev
}

# Function to install dependencies
install_dependencies() {
    local needs_install=false
    
    if [ ! -d "node_modules" ]; then
        needs_install=true
    elif [ ! -d "frontend/node_modules" ]; then
        needs_install=true  
    elif [ ! -d "backend/node_modules" ]; then
        needs_install=true
    fi
    
    if [ "$needs_install" = true ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        
        if [ -f "package.json" ]; then
            npm install
        fi
        
        if [ -f "frontend/package.json" ]; then
            (cd frontend && npm install)
        fi
        
        if [ -f "backend/package.json" ]; then
            (cd backend && npm install)
        fi
        
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    fi
}

# Function to cleanup development environment
cleanup_dev() {
    echo -e "\n${YELLOW}🧹 Cleaning up development environment...${NC}"
    
    # Stop MongoDB container if it was started by this script
    if docker ps -q --filter "name=form-builder-mongodb-dev" | grep -q .; then
        docker stop form-builder-mongodb-dev > /dev/null 2>&1
        docker rm form-builder-mongodb-dev > /dev/null 2>&1
        echo -e "${GREEN}✅ MongoDB container stopped${NC}"
    fi
    
    exit 0
}

# Function to start the application in production mode using Docker
start_prod() {
    echo -e "${GREEN}🚀 Starting in production mode with Docker Compose...${NC}"
    
    # Check if required files exist
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ docker-compose.yml not found${NC}"
        exit 1
    fi
    
    # Build and start containers
    echo -e "${BLUE}🔨 Building and starting containers...${NC}"
    $DOCKER_COMPOSE_CMD up --build -d
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Services started successfully${NC}"
        
        # Wait for services to be ready
        sleep 5
        
        echo -e "\n${GREEN}🌐 Application URLs:${NC}"
        echo -e "   Main App:  ${GREEN}http://localhost:${NGINX_PORT:-80}${NC}"
        echo -e "   Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT:-3000}${NC}"
        echo -e "   Backend:   ${GREEN}http://localhost:${BACKEND_PORT:-4001}${NC}"
        echo -e "   Database:  ${GREEN}mongodb://localhost:${MONGO_PORT:-27017}/${MONGO_INITDB_DATABASE:-form-builder}${NC}"
        
        echo -e "\n${BLUE}📋 Useful commands:${NC}"
        echo -e "   View logs:    ${YELLOW}$DOCKER_COMPOSE_CMD logs -f${NC}"
        echo -e "   Stop:         ${YELLOW}$DOCKER_COMPOSE_CMD down${NC}"
        echo -e "   Restart:      ${YELLOW}$DOCKER_COMPOSE_CMD restart${NC}"
        echo -e "   Status:       ${YELLOW}$DOCKER_COMPOSE_CMD ps${NC}"
    else
        echo -e "${RED}❌ Failed to start services${NC}"
        exit 1
    fi
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    
    if [ -f "docker-compose.yml" ]; then
        $DOCKER_COMPOSE_CMD down
        echo -e "${GREEN}✅ Docker services stopped${NC}"
    fi
    
    # Also stop dev MongoDB if running
    if docker ps -q --filter "name=form-builder-mongodb-dev" | grep -q .; then
        docker stop form-builder-mongodb-dev > /dev/null 2>&1
        docker rm form-builder-mongodb-dev > /dev/null 2>&1
        echo -e "${GREEN}✅ Development MongoDB stopped${NC}"
    fi
    
    exit 0
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Service Status${NC}"
    echo -e "${YELLOW}------------------${NC}"
    
    if [ -f "docker-compose.yml" ]; then
        $DOCKER_COMPOSE_CMD ps
    else
        echo -e "${YELLOW}No docker-compose.yml found${NC}"
    fi
}

# Function to display help
show_help() {
    echo -e "${GREEN}Usage: ./start.sh [command]${NC}"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  dev       Start in development mode (default)"
    echo "  prod      Start in production mode using Docker"
    echo "  stop      Stop all running containers"
    echo "  status    Show service status"
    echo "  help      Show this help message"
    echo ""
    echo -e "${BLUE}Development Mode:${NC}"
    echo "  - Uses local Node.js installation"
    echo "  - Starts MongoDB in Docker if not installed locally"
    echo "  - Hot reload for frontend and backend"
    echo ""
    echo -e "${BLUE}Production Mode:${NC}"
    echo "  - Uses Docker Compose"
    echo "  - Builds optimized containers"
    echo "  - Includes Nginx reverse proxy"
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
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ $# -eq 0 ]; then
            start_dev
        else
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            show_help
        fi
        ;;
esac
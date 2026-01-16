#!/bin/bash

# Z.AI Development Environment Startup Script
# ==========================================
# This script manages both the Next.js frontend and VAL Core backend projects

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║        Z.AI Development Environment                       ║"
    echo "║                                                           ║"
    echo "║  Next.js Frontend + VAL Core Financial Backend System    ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" &> /dev/null
}

# Function to start Next.js Frontend
start_frontend() {
    print_info "Starting Next.js Frontend (Port 3000)..."

    if port_in_use 3000; then
        print_warning "Port 3000 is already in use. Frontend may already be running."
        return 0
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        bun install
    fi

    # Setup database if needed
    if [ ! -f "prisma/dev.db" ]; then
        print_info "Setting up database..."
        bun run db:push
    fi

    # Start the dev server in background
    print_info "Starting Next.js development server..."
    nohup bun run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .frontend.pid

    # Wait for server to start
    sleep 5

    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        print_success "Frontend started successfully (PID: $FRONTEND_PID)"
        print_info "Access at: http://localhost:3000"
        print_info "Logs: tail -f frontend.log"
    else
        print_error "Failed to start frontend. Check frontend.log for details."
        return 1
    fi
}

# Function to start VAL Core Backend
start_backend() {
    print_info "Starting VAL Core Backend (Port 3001)..."

    if port_in_use 3001; then
        print_warning "Port 3001 is already in use. Backend may already be running."
        return 0
    fi

    cd "gm-family-trust---val-core--1-"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing backend dependencies..."
        bun install
    fi

    # Start the VAL Core server in background
    print_info "Starting VAL Core backend server..."
    nohup bun run server > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid

    # Return to project root
    cd ..

    # Wait for server to start
    sleep 5

    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_success "Backend started successfully (PID: $BACKEND_PID)"
        print_info "Access at: http://localhost:3001"
        print_info "Logs: tail -f gm-family-trust---val-core--1-/backend.log"
    else
        print_error "Failed to start backend. Check backend.log for details."
        return 1
    fi
}

# Function to start Infrastructure Services
start_infrastructure() {
    print_info "Starting Infrastructure Services..."

    cd "gm-family-trust---val-core--1-"

    # Check if docker-compose.yml exists
    if [ -f "docker-compose.yml" ]; then
        print_info "Starting Docker containers (PostgreSQL, TigerBeetle, etc.)..."
        bun run infra:up

        if [ $? -eq 0 ]; then
            print_success "Infrastructure services started"
            print_info "PostgreSQL: Port 5432"
            print_info "TigerBeetle: Port 3000"
        else
            print_error "Failed to start infrastructure services"
            return 1
        fi
    else
        print_warning "docker-compose.yml not found. Skipping infrastructure startup."
    fi

    cd ..
}

# Function to open monitor dashboard
open_monitor() {
    print_info "Opening VAL Core Monitor Dashboard..."

    MONITOR_FILE="gm-family-trust---val-core--1-/monitor.html"

    if [ -f "$MONITOR_FILE" ]; then
        if command_exists xdg-open; then
            xdg-open "$MONITOR_FILE" 2>/dev/null
        elif command_exists open; then
            open "$MONITOR_FILE" 2>/dev/null
        else
            print_info "Monitor file location: $MONITOR_FILE"
            print_info "Open this file in your web browser to view the dashboard"
        fi
    else
        print_warning "Monitor dashboard not found at: $MONITOR_FILE"
    fi
}

# Function to stop all services
stop_all() {
    print_info "Stopping all services..."

    # Stop frontend
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID
            print_success "Frontend stopped (PID: $FRONTEND_PID)"
        fi
        rm .frontend.pid
    fi

    # Stop backend
    if [ -f "gm-family-trust---val-core--1-/.backend.pid" ]; then
        BACKEND_PID=$(cat gm-family-trust---val-core--1-/.backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID
            print_success "Backend stopped (PID: $BACKEND_PID)"
        fi
        rm gm-family-trust---val-core--1-/.backend.pid
    fi

    print_success "All services stopped"
}

# Function to show status
show_status() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                    SERVICE STATUS                          ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    # Check frontend
    if port_in_use 3000; then
        echo -e "  Frontend (Next.js):    ${GREEN}RUNNING${NC} (Port 3000)"
    else
        echo -e "  Frontend (Next.js):    ${RED}STOPPED${NC}"
    fi

    # Check backend
    if port_in_use 3001; then
        echo -e "  Backend (VAL Core):    ${GREEN}RUNNING${NC} (Port 3001)"
    else
        echo -e "  Backend (VAL Core):    ${RED}STOPPED${NC}"
    fi

    # Check PostgreSQL
    if port_in_use 5432; then
        echo -e "  PostgreSQL:             ${GREEN}RUNNING${NC} (Port 5432)"
    else
        echo -e "  PostgreSQL:             ${RED}STOPPED${NC}"
    fi

    # Check TigerBeetle
    if port_in_use 3000; then
        echo -e "  TigerBeetle:           ${GREEN}RUNNING${NC} (Port 3000)"
    else
        echo -e "  TigerBeetle:           ${RED}STOPPED${NC}"
    fi

    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to show help
show_help() {
    cat << EOF

Usage: ./start.sh [COMMAND] [OPTIONS]

Commands:
    start-all       Start all services (frontend, backend, infrastructure)
    start-frontend  Start only the Next.js frontend (Port 3000)
    start-backend   Start only the VAL Core backend (Port 3001)
    start-infra     Start only infrastructure services (Docker)
    start-monitor   Open the VAL Core monitor dashboard
    stop            Stop all running services
    status          Show status of all services
    help            Show this help message

Examples:
    ./start.sh start-all              # Start everything
    ./start.sh start-frontend         # Start only frontend
    ./start.sh start-backend          # Start only backend
    ./start.sh stop                   # Stop all services
    ./start.sh status                 # Check service status

Services:
    • Next.js Frontend (Port 3000)    - Main web application
    • VAL Core Backend (Port 3001)    - Financial transaction processing
    • PostgreSQL (Port 5432)          - Database (narrative mirror)
    • TigerBeetle (Port 3000)         - Clearing authority
    • Monitor Dashboard               - Visual service monitoring

EOF
}

# Main script logic
main() {
    show_banner

    case "${1:-help}" in
        start-all)
            print_info "Starting all services..."
            start_infrastructure
            start_backend
            start_frontend
            open_monitor
            show_status
            ;;
        start-frontend)
            start_frontend
            ;;
        start-backend)
            start_backend
            ;;
        start-infra)
            start_infrastructure
            ;;
        start-monitor)
            open_monitor
            ;;
        stop)
            stop_all
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

#!/bin/bash

##############################################################################
# NITTE Merchandise Shop - Smart Setup & Management Script
# 
# Full-stack e-commerce platform with:
#  * RBAC Policy System (Dynamic MongoDB-backed access control)
#  * OpenAPI v3.1 with Swagger UI (/api/docs)
#  * BDD Workflows (Cucumber/Gherkin feature files)
#  * Zustand State Management (Frontend)
# 
# This script provides:
# - setup: Build Docker images + start all services (first time)
# - start: Start services from cached images (FAST - 5-10 sec)
# - stop: Stop all services (preserve data in volumes)
# - restart: Stop + start services
# - status: Check health status of all services
# - logs: View real-time service logs
# - rebuild: Force rebuild all images (no cache)
# - clean: Remove containers (keeps volumes/data)
#
# QUICK START:
#  1. ./nitte-setup.sh setup        # First time (15-30 min, builds images)
#  2. ./demo.sh test                # Run automated API tests
#  3. http://localhost:3000/api/docs # View & test API in Swagger UI
#
# For faster iterations: ./nitte-setup.sh start (uses cached images)
#
# USAGE: ./nitte-setup.sh [command] [service]
# DEFAULT: setup (if no command specified)
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Command from argument or default to 'setup'
COMMAND="${1:-setup}"
SERVICE="${2:-}"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
    return 1
}

print_warning() {
    echo -e "${YELLOW} $1${NC}"
}

print_info() {
    echo -e "${BLUE} $1${NC}"
}

# Check if Docker images exist locally
check_images_exist() {
    local all_exist=true
    
    if ! docker image inspect nitte_node-backend:latest &>/dev/null 2>&1; then
        all_exist=false
    fi
    
    if ! docker image inspect nitte_python-service:latest &>/dev/null 2>&1; then
        all_exist=false
    fi
    
    if [ "$all_exist" = true ]; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Docker
    if command -v docker &>/dev/null; then
        print_success "Docker found ($(docker --version | awk '{print $3}' | sed 's/,//'))"
    else
        print_error "Docker is not installed"
        all_ok=false
    fi
    
    # Check Docker Compose
    if docker compose version &>/dev/null; then
        print_success "Docker Compose found"
    else
        print_error "Docker Compose is not installed"
        all_ok=false
    fi
    
    # Check Docker daemon is running
    if docker info &>/dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        print_info "Run: docker daemon (on macOS) or systemctl start docker (on Linux)"
        all_ok=false
    fi
    
    if [ "$all_ok" = false ]; then
        exit 1
    fi
    
    echo ""
}

check_project_structure() {
    print_header "Validating Project Structure"
    
    local required_dirs=("docker" "monitoring" "frontend" "admin-dashboard" "node-backend" "python-service" "database")
    local all_ok=true
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Found: $dir"
        else
            print_error "Missing: $dir"
            all_ok=false
        fi
    done
    
    if [ "$all_ok" = false ]; then
        exit 1
    fi
    
    echo ""
}

# ============================================================================
# MAIN COMMANDS
# ============================================================================

cmd_setup() {
    print_header "NITTE Merchandise Shop - First-Time Setup"
    print_info "This is a one-time operation that builds Docker images"
    
    check_prerequisites
    check_project_structure
    
    if check_images_exist; then
        print_warning "Docker images already exist. Skipping build."
        print_info "Run './nitte-setup.sh rebuild' to force a full rebuild."
        print_info "Or './nitte-setup.sh start' to just start services."
    else
        print_info "Building Docker images..."
        print_warning "First-time build takes 15-30 minutes. Subsequent builds use cache."
        echo ""
        cd docker
        docker compose build --no-cache
        cd "$SCRIPT_DIR"
        echo ""
        print_success "Docker images built successfully"
    fi
    
    cmd_start
}

cmd_start() {
    print_header "Starting NITTE Merchandise Shop"
    
    check_prerequisites
    
    print_info "Starting core services..."
    cd docker
    docker compose up -d
    cd "$SCRIPT_DIR"
    print_success "Core services started"
    
    print_info "Starting monitoring stack..."
    cd monitoring
    docker compose up -d
    cd "$SCRIPT_DIR"
    print_success "Monitoring stack started"
    
    echo""
    print_info "Waiting 15 seconds for services to initialize..."
    sleep 15
    
    cmd_status
    cmd_display_endpoints
}

cmd_stop() {
    print_header "Stopping NITTE Merchandise Shop"
    
    print_info "Stopping core services..."
    cd docker
    docker compose down
    cd "$SCRIPT_DIR"
    
    print_info "Stopping monitoring services..."
    cd monitoring
    docker compose down
    cd "$SCRIPT_DIR"
    
    echo ""
    print_success "All services stopped"
    print_info "Data volumes preserved - run './nitte-setup.sh start' to resume"
}

cmd_restart() {
    print_header "Restarting NITTE Merchandise Shop"
    cmd_stop
    echo ""
    sleep 2
    cmd_start
}

cmd_status() {
    print_header "Service Status"
    
    echo "Running containers:"
    docker ps --filter "name=nitte" || echo "No containers found"
    
    echo ""
    print_info "Checking service health..."
    local healthy=0
    local total=0
    
    local services=("nitte-mongodb" "nitte-node-backend" "nitte-python-service" "nitte-frontend" "nitte-admin-dashboard" "nitte-prometheus" "nitte-grafana" "nitte-jaeger")
    
    for service in "${services[@]}"; do
        total=$((total + 1))
        if docker inspect "$service" &>/dev/null 2>&1; then
            local status=$(docker inspect -f '{{.State.Status}}' "$service" 2>/dev/null || echo "unknown")
            if [ "$status" = "running" ]; then
                local health=$(docker inspect -f '{{.State.Health.Status}}' "$service" 2>/dev/null || echo "OK")
                if [ "$health" = "healthy" ] || [ "$health" = "OK" ]; then
                    print_success "$service: healthy"
                    healthy=$((healthy + 1))
                elif [ "$health" = "starting" ]; then
                    print_info "$service: starting..."
                else
                    print_warning "$service: initializing"
                    healthy=$((healthy + 1))
                fi
            else
                print_error "$service: $status"
            fi
        else
            print_warning "$service: not running"
        fi
    done
    
    echo ""
    echo "Health Summary: $healthy/$total services healthy"
}

cmd_logs() {
    if [ -z "$SERVICE" ]; then
        print_header "Recent Logs (Last 20 lines)"
        docker compose -f docker/docker-compose.yml logs --tail=20 2>/dev/null || true
        docker compose -f monitoring/docker-compose.yml logs --tail=20 2>/dev/null || true
    else
        print_header "Logs for $SERVICE (following in real-time)"
        docker logs -f --tail=50 "$SERVICE" 2>/dev/null || print_error "Service not found: $SERVICE"
    fi
}

cmd_rebuild() {
    print_header "Force Rebuilding All Docker Images"
    
    check_prerequisites
    check_project_structure
    
    print_warning "This will rebuild all images from scratch (takes 20+ minutes)..."
    print_info "Removing existing images..."
    
    docker rmi nitte_node-backend:latest 2>/dev/null || true
    docker rmi nitte_python-service:latest 2>/dev/null || true
    
    print_info "Building fresh images..."
    cd docker
    docker compose build --no-cache
    cd "$SCRIPT_DIR"
    
    echo ""
    print_success "Images rebuilt successfully"
    print_info "Run './nitte-setup.sh start' to start with new images"
}

cmd_clean() {
    print_header "Cleaning Up Containers"
    
    print_warning "This will remove Docker containers but preserve all data volumes..."
    
    print_info "Stopping and removing containers from docker/..."
    cd docker
    docker compose down --remove-orphans 2>/dev/null || true
    cd "$SCRIPT_DIR"
    
    print_info "Stopping and removing containers from monitoring/..."
    cd monitoring
    docker compose down --remove-orphans 2>/dev/null || true
    cd "$SCRIPT_DIR"
    
    echo ""
    print_success "Cleanup complete"
    print_info "Data volumes preserved - run './nitte-setup.sh setup' to start fresh"
}

cmd_display_endpoints() {
    print_header "NITTE Merchandise Shop - All URLs Ready"
    
    echo -e "${GREEN}Frontend Applications:${NC}"
    echo -e "  • User App:              ${BLUE}http://localhost:5173${NC}"
    echo -e "  • Admin Dashboard:       ${BLUE}http://localhost:5174${NC}"
    
    echo ""
    echo -e "${GREEN}API Gateway & Documentation (Port 3000):${NC}"
    echo -e "  • API Base:              ${BLUE}http://localhost:3000/api/v1${NC}"
    echo -e "  • API Docs (Swagger UI): ${BLUE}http://localhost:3000/api/docs${NC} ⭐ ${YELLOW}Try endpoints here!${NC}"
    echo -e "  • Health Check:          ${BLUE}http://localhost:3000/api/v1/health${NC}"
    echo -e "  • Products:              ${BLUE}http://localhost:3000/api/v1/products${NC}"
    echo -e "  • Orders:                ${BLUE}http://localhost:3000/api/v1/orders${NC}"
    echo -e "  • Admin Policies:        ${BLUE}http://localhost:3000/api/v1/admin/policies${NC} (admin only)"
    
    echo ""
    echo -e "${GREEN}Observability & Monitoring:${NC}"
    echo -e "  • Jaeger Traces:         ${BLUE}http://localhost:16686${NC}"
    echo -e "  • Prometheus Metrics:    ${BLUE}http://localhost:9090${NC}"
    echo -e "  • Grafana Dashboards:    ${BLUE}http://localhost:3001${NC} (admin/admin123)"
    echo -e "  • AlertManager:          ${BLUE}http://localhost:9093${NC}"
    
    echo ""
    echo -e "${GREEN}Database (Internal):${NC}"
    echo -e "  • MongoDB:               ${BLUE}localhost:27017${NC} (admin/password)"
    echo -e "  • Python Service:        ${BLUE}http://localhost:8000${NC}"
    
    echo ""
    echo -e "${GREEN}Default Test Credentials:${NC}"
    echo -e "  • Admin:  ${YELLOW}admin@test.com${NC} / ${YELLOW}Password123!${NC}"
    echo -e "  • User:   ${YELLOW}user@test.com${NC} / ${YELLOW}Password123!${NC}"
    echo -e "  • DB:     ${YELLOW}admin${NC} / ${YELLOW}password${NC}"
    
    echo ""
    echo -e "${GREEN}Quick Start - Demo Script:${NC}"
    echo -e "  ${YELLOW}./demo.sh test${NC}    # Run automated API tests"
    echo -e "  ${YELLOW}./demo.sh docs${NC}    # Open Swagger UI"
    echo -e "  ${YELLOW}./demo.sh status${NC}  # Check service health"
    echo -e "  ${YELLOW}./demo.sh logs${NC}    # View service logs"
    
    echo ""
    echo -e "${GREEN}Quick Test Commands:${NC}"
    echo "  curl http://localhost:3000/api/v1/health"
    echo "  curl http://localhost:3000/api/v1/products"
    
    echo ""
    echo -e "${YELLOW}Features Enabled:${NC}"
    echo "  ✓ BDD Workflows (7 feature files in /docs/bdd/features/)"
    echo "  ✓ Zustand State Management (Guest/Authenticated separation)"
    echo "  ✓ OpenAPI v3.1 with Swagger UI"
    echo "  ✓ RBAC Policy System (Dynamic MongoDB-backed)"
    echo "  ✓ JWT Authentication"
    echo "  ✓ OpenTelemetry Tracing (Jaeger)"
    echo "  ✓ Prometheus Metrics & Grafana Dashboards"
    
    echo ""
    print_success "All services ready! Start with: ./demo.sh test"
}

cmd_help() {
    cat << EOF
${BLUE}NITTE Setup Script - Interactive Management${NC}

${GREEN}USAGE:${NC}
  ./nitte-setup.sh [command] [service]

${GREEN}COMMANDS:${NC}
  ${YELLOW}setup${NC}       Build Docker images + start services (first time)
  ${YELLOW}start${NC}       Start services (FAST - uses cached images)
  ${YELLOW}stop${NC}        Stop all services (data preserved in volumes)
  ${YELLOW}restart${NC}     Stop and start all services
  ${YELLOW}status${NC}      Check health status of all services
  ${YELLOW}logs${NC}        View container logs (optional: [service_name])
  ${YELLOW}rebuild${NC}     Force rebuilding all images (no cache)
  ${YELLOW}clean${NC}       Remove containers (preserve data volumes)
  ${YELLOW}help${NC}        Show this help message

${GREEN}EXAMPLES:${NC}
  ./nitte-setup.sh                    # First time: build + start
  ./nitte-setup.sh start              # Just start (if images exist)
  ./nitte-setup.sh logs               # Show all logs
  ./nitte-setup.sh logs nitte-node-backend
  ./nitte-setup.sh stop               # Stop services
  ./nitte-setup.sh restart            # Restart services
  ./nitte-setup.sh rebuild            # Rebuild everything
  ./nitte-setup.sh clean              # Clean containers

${GREEN}QUICK TESTING (Alternative to setup):${NC}
  Run: ${YELLOW}./demo.sh [command]${NC}
  
  ${YELLOW}./demo.sh setup${NC}       # Full setup with Docker
  ${YELLOW}./demo.sh test${NC}        # Run automated API tests
  ${YELLOW}./demo.sh docs${NC}        # Open Swagger UI in browser
  ${YELLOW}./demo.sh status${NC}      # Check all services
  ${YELLOW}./demo.sh logs${NC}        # View service logs

${GREEN}DEVELOPER WORKFLOW:${NC}
  1. First time:       ./nitte-setup.sh setup          (~30 minutes)
  2. Daily dev start:  ./nitte-setup.sh start          (~5 seconds)
  3. Test features:    ./demo.sh test                  (automated tests)
  4. API Testing:      ./demo.sh docs                  (Swagger UI)
  5. End of day:       ./nitte-setup.sh stop           (saves data)
  6. Resume work:      ./nitte-setup.sh start          (~5 seconds)
  7. Update code:      ./nitte-setup.sh restart        (~60 seconds)
  8. After long break: ./nitte-setup.sh rebuild        (~30 minutes)

${GREEN}GETTING STARTED:${NC}
  1. Setup:            ./nitte-setup.sh setup
  2. Test APIs:        ./demo.sh test
  3. View Docs:        ./demo.sh docs
  4. Dashboards:       http://localhost:3001 (admin/admin123)
  5. Traces:           http://localhost:16686

${GREEN}DEFAULT CREDENTIALS:${NC}
  Admin:  admin@test.com / Password123!
  User:   user@test.com / Password123!
  DB:     admin / password

${GREEN}PERFORMANCE TIMES:${NC}
  setup / rebuild:     15-30 minutes (builds Docker images)
  start:               5-10 seconds (uses cached images)
  restart:             ~60 seconds (if code changed)
  stop:                5 seconds
  status:              2 seconds
  test (demo.sh):      30-60 seconds (full API test suite)

${GREEN}IMPORTANT URLS:${NC}
  API Docs (Swagger):  http://localhost:3000/api/docs
  API Base:            http://localhost:3000/api/v1
  Admin Policies:      http://localhost:3000/api/v1/admin/policies
  Jaeger UI:           http://localhost:16686
  Prometheus:          http://localhost:9090
  Grafana:             http://localhost:3000
  Frontend:            http://localhost:5173

${GREEN}DOCUMENTATION:${NC}
  IMPLEMENTATION_SUMMARY.md  - Complete project overview
  RBAC_POLICY_GUIDE.md       - Role-based access control system
  OPENAPI_GUIDE.md           - API documentation & Swagger UI
  WORKFLOWS.md               - BDD user workflows
  docs/bdd/features/         - BDD feature files (Gherkin)

EOF
}

# ============================================================================
# MAIN DISPATCHER
# ============================================================================

case "$COMMAND" in
    setup)
        cmd_setup
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs
        ;;
    rebuild)
        cmd_rebuild
        ;;
    clean)
        cmd_clean
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        cmd_help
        exit 1
        ;;
esac

exit 0

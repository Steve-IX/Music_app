#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js (v22.x or later)")
    else
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 22 ]; then
            missing_deps+=("Node.js v22.x or later (current: $(node -v))")
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm (v10.x or later)")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    if ! command_exists git; then
        missing_deps+=("Git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install the missing dependencies and run this script again."
        echo "Visit https://docs.docker.com/get-docker/ for Docker installation."
        echo "Visit https://nodejs.org/ for Node.js installation."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Function to setup environment variables
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        cat > .env.local << 'EOF'
# =============================================================================
# MusicStream Environment Configuration
# =============================================================================

# Application Settings
NODE_ENV=development
LOG_LEVEL=debug
APP_NAME=musicstream
APP_VERSION=1.0.0

# Database Configuration
DATABASE_URL=postgresql://musicstream:dev_password@localhost:5432/musicstream
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Authentication & Security (Keycloak)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=musicstream
KEYCLOAK_CLIENT_ID=musicstream-web
KEYCLOAK_CLIENT_SECRET=dev-client-secret-change-in-production
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# JWT Configuration
JWT_SECRET=development-jwt-secret-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# External Service Integrations (Optional - add your own keys)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# File Storage (MinIO/S3)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=musicstream
S3_REGION=us-east-1

# Message Queue & Events
NATS_URL=nats://localhost:4222

# Monitoring & Observability
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=admin
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# Development Ports
WEB_PORT=3000
AUTH_SERVICE_PORT=4001
CATALOG_SERVICE_PORT=4002
STREAMING_SERVICE_PORT=4003
SOCIAL_SERVICE_PORT=4004
RECOMMENDATIONS_SERVICE_PORT=4005
NOTIFICATIONS_SERVICE_PORT=4006

# Feature Flags
FEATURE_SOCIAL_ENABLED=true
FEATURE_RECOMMENDATIONS_ENABLED=true
FEATURE_OFFLINE_MODE_ENABLED=true
FEATURE_HIGH_QUALITY_AUDIO_ENABLED=true
FEATURE_COLLABORATIVE_PLAYLISTS_ENABLED=true

# Audio Processing
AUDIO_QUALITY_DEFAULT=high
AUDIO_CROSSFADE_DURATION=3000
AUDIO_GAPLESS_ENABLED=true
AUDIO_NORMALIZATION_ENABLED=true
EOF
        print_success "Created .env.local file with default development configuration"
    else
        print_warning ".env.local already exists, skipping environment setup"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed successfully!"
}

# Function to start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services with Docker Compose..."
    
    # Pull latest images
    docker-compose pull
    
    # Start services in detached mode
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL to be ready..."
    timeout=60
    while ! docker-compose exec -T postgres pg_isready -U musicstream >/dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "PostgreSQL failed to start within 60 seconds"
            exit 1
        fi
    done
    
    # Wait for Redis
    print_status "Waiting for Redis to be ready..."
    timeout=30
    while ! docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Redis failed to start within 30 seconds"
            exit 1
        fi
    done
    
    # Wait for Elasticsearch
    print_status "Waiting for Elasticsearch to be ready..."
    timeout=90
    while ! curl -s http://localhost:9200/_cluster/health >/dev/null 2>&1; do
        sleep 3
        timeout=$((timeout - 3))
        if [ $timeout -le 0 ]; then
            print_error "Elasticsearch failed to start within 90 seconds"
            exit 1
        fi
    done
    
    # Wait for Keycloak
    print_status "Waiting for Keycloak to be ready..."
    timeout=120
    while ! curl -s http://localhost:8080/health >/dev/null 2>&1; do
        sleep 3
        timeout=$((timeout - 3))
        if [ $timeout -le 0 ]; then
            print_error "Keycloak failed to start within 120 seconds"
            exit 1
        fi
    done
    
    print_success "All infrastructure services are ready!"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Note: In a real implementation, you would run migrations here
    # For now, we'll just verify the connection
    if docker-compose exec -T postgres psql -U musicstream -d musicstream -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connection verified!"
    else
        print_error "Failed to connect to database"
        exit 1
    fi
    
    print_warning "Database migrations not yet implemented - run 'npm run db:migrate' when available"
}

# Function to show service status
show_status() {
    print_status "Showing service status..."
    docker-compose ps
    
    echo ""
    print_success "MusicStream development environment is ready!"
    echo ""
    echo "🌐 Access your services:"
    echo "  Web Application:    http://localhost:3000"
    echo "  Keycloak Admin:     http://localhost:8080/admin/ (admin/admin)"
    echo "  Grafana:            http://localhost:3001 (admin/admin)"
    echo "  Neo4j Browser:      http://localhost:7474 (neo4j/password)"
    echo "  MinIO Console:      http://localhost:9001 (minioadmin/minioadmin)"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Start the development servers: npm run dev"
    echo "  2. Run tests: npm test"
    echo "  3. View logs: docker-compose logs -f"
    echo ""
    echo "📚 Documentation:"
    echo "  - System Design: ./SYSTEM_DESIGN.md"
    echo "  - API Schema: ./api/"
    echo "  - README: ./README.md"
    echo ""
}

# Main setup function
main() {
    echo ""
    echo "🎵 MusicStream Development Environment Setup"
    echo "=============================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "This script must be run from the MusicStream root directory"
        exit 1
    fi
    
    check_prerequisites
    setup_environment
    install_dependencies
    start_infrastructure
    setup_database
    show_status
    
    print_success "Setup completed successfully! 🎉"
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@" 
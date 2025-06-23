# MusicStream Development Environment Setup - Windows PowerShell Version
# Run this script as: .\scripts\setup-windows.ps1

Write-Host ""
Write-Host "🎵 MusicStream Development Environment Setup (Windows)" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "docker-compose.yml")) {
    Write-Host "[ERROR] This script must be run from the MusicStream root directory" -ForegroundColor Red
    exit 1
}

# Check prerequisites
Write-Host "[INFO] Checking prerequisites..." -ForegroundColor Cyan

$missingDeps = @()

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    $missingDeps += "Node.js (v22.x or later)"
}

if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    $missingDeps += "npm (v10.x or later)"
}

if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    $missingDeps += "Docker"
}

if (-not (Get-Command "docker-compose" -ErrorAction SilentlyContinue)) {
    $missingDeps += "Docker Compose"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "[ERROR] Missing required dependencies:" -ForegroundColor Red
    $missingDeps | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please install the missing dependencies and run this script again." -ForegroundColor Yellow
    Write-Host "Visit https://docs.docker.com/get-docker/ for Docker installation." -ForegroundColor Yellow
    Write-Host "Visit https://nodejs.org/ for Node.js installation." -ForegroundColor Yellow
    exit 1
}

Write-Host "[SUCCESS] All prerequisites are installed!" -ForegroundColor Green

# Setup environment variables
Write-Host "[INFO] Setting up environment configuration..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "[SUCCESS] Created .env.local file with default development configuration" -ForegroundColor Green
} else {
    Write-Host "[WARNING] .env.local already exists, skipping environment setup" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "[INFO] Installing Node.js dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Start infrastructure services
Write-Host "[INFO] Starting infrastructure services with Docker Compose..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Infrastructure services started!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start infrastructure services" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Show status
Write-Host "[INFO] Showing service status..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "[SUCCESS] MusicStream development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your services:" -ForegroundColor Green
Write-Host "  Web Application:    http://localhost:3000"
Write-Host "  Keycloak Admin:     http://localhost:8080/admin/ (admin/admin)"
Write-Host "  Grafana:            http://localhost:3001 (admin/admin)"
Write-Host "  Neo4j Browser:      http://localhost:7474 (neo4j/password)"
Write-Host "  MinIO Console:      http://localhost:9001 (minioadmin/minioadmin)"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "  1. Start the development servers: npm run dev"
Write-Host "  2. Run tests: npm test"
Write-Host "  3. View logs: docker-compose logs -f"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Green
Write-Host "  - System Design: .\SYSTEM_DESIGN.md"
Write-Host "  - API Schema: .\api\"
Write-Host "  - README: .\README.md"
Write-Host ""
Write-Host "[SUCCESS] Setup completed successfully!" -ForegroundColor Green 
# 🎵 MusicStream

> **Music—anywhere, anytime, beautifully**

A comprehensive, production-ready music streaming platform built with modern technologies, supporting iOS, Android, and Web platforms with real-time social features, intelligent recommendations, and high-quality audio streaming.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://docs.docker.com/compose/)

## 🌟 Features

### 🎧 **Audio Experience**
- **Gapless Playback**: Seamless transitions between tracks
- **High-Quality Streaming**: Lossless FLAC, Hi-Res Audio support
- **10-Band Equalizer**: Custom audio tuning
- **Offline Downloads**: Smart caching for on-the-go listening
- **Multi-Platform Casting**: AirPlay 2, Chromecast, Bluetooth, CarPlay

### 🔍 **Discovery & Search**
- **AI-Powered Recommendations**: Collaborative filtering + content-based ML
- **Smart Search**: Artists, tracks, albums, lyrics with real-time suggestions
- **Hierarchical Filters**: Advanced filtering by genre, year, mood, BPM
- **New Release Hub**: Latest music from followed artists

### 📚 **Library Management**
- **Smart Playlists**: Auto-updating based on listening habits
- **Collaborative Playlists**: Real-time editing with friends
- **Bulk Operations**: Mass organize your music collection
- **Deep Link Sharing**: Share playlists with custom URLs

### 👥 **Social Features**
- **Follow System**: Connect with friends and artists
- **Activity Feed**: See what others are listening to
- **Real-time Presence**: Live listening status
- **Group Chat**: Discuss music with private/group messaging

### 🔐 **Security & Privacy**
- **OAuth 2.0**: Apple Sign-In, Google integration
- **GDPR Compliant**: Full data export and deletion
- **Device Management**: Control access across all devices
- **End-to-End Encryption**: Secure messaging and data

## 🏗️ Architecture

MusicStream uses a modern microservices architecture with the following technology stack:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, SwiftUI 4, Jetpack Compose | Cross-platform UI |
| **API Gateway** | GraphQL (Apollo Server 5) + REST | Unified data access |
| **Authentication** | Keycloak 25 | Identity & access management |
| **Backend** | Node.js 22, Microservices | Business logic |
| **Database** | PostgreSQL 16, Redis 7 | Primary & cache storage |
| **Search** | Elasticsearch 8 | Full-text search |
| **Recommendations** | Neo4j 6 | Graph-based ML |
| **Streaming** | CloudFront CDN, HLS/CMAF | Audio delivery |
| **Messaging** | NATS JetStream | Event sourcing |
| **Container** | Docker, Kubernetes (Helm) | Deployment |
| **Monitoring** | OpenTelemetry, Grafana, Sentry | Observability |

## 📁 Project Structure

```
music_app/
├── 📱 apps/                    # Client applications
│   ├── web/                   # React 19 web app
│   ├── ios/                   # SwiftUI iOS app (planned)
│   └── android/               # Jetpack Compose Android app (planned)
├── 🔧 services/               # Backend microservices
│   ├── auth/                  # Authentication service
│   ├── catalog/               # Music catalog service
│   ├── streaming/             # Audio streaming service
│   ├── social/                # Social features service
│   ├── recommendations/       # ML recommendation engine
│   └── notifications/         # Push notification service
├── 📦 packages/               # Shared libraries
│   ├── shared/                # Common utilities & types
│   ├── ui-components/         # Reusable UI components
│   └── api-client/            # GraphQL/REST client
├── 🗄️ api/                    # API specifications
│   ├── schema.graphql        # GraphQL schema
│   └── openapi.yaml          # REST API specification
├── 🏗️ terraform/              # Infrastructure as Code
│   ├── main.tf               # AWS infrastructure
│   ├── variables.tf          # Configuration variables
│   └── outputs.tf            # Infrastructure outputs
├── 🧪 tests/                  # Testing suites
│   ├── e2e/                  # End-to-end tests (Playwright)
│   ├── integration/          # Integration tests
│   └── performance/          # Load & performance tests
├── 📋 docs/                   # Documentation
│   └── SYSTEM_DESIGN.md      # Architecture documentation
├── 🐳 docker-compose.yml      # Local development environment
└── 📦 package.json           # Workspace configuration
```

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js**: 22.x or later ([Download](https://nodejs.org/))
- **npm**: 10.x or later (comes with Node.js)
- **Docker**: Latest version ([Download](https://www.docker.com/get-started))
- **Docker Compose**: v2.0+ (included with Docker Desktop)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Option A: Automated Setup (Recommended)

Use our automated setup script for the fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/your-org/music_app.git
cd music_app

# Run the automated setup script (Linux/macOS)
./scripts/setup.sh

# For Windows (PowerShell)
.\scripts\setup-windows.ps1

# For Windows (manual setup), follow Option B below
```

The setup script will:
- ✅ Check all prerequisites
- ✅ Install Node.js dependencies
- ✅ Create environment configuration
- ✅ Start all infrastructure services
- ✅ Verify database connections
- ✅ Display service URLs and next steps

### Option B: Manual Setup

If you prefer to set up manually or are on Windows:

#### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/music_app.git
cd music_app

# Install dependencies for all workspaces
npm install
```

#### 2. Environment Configuration

Create your environment configuration file `.env.local`:

```bash
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
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# External Service Integrations
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

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
```

#### 3. Start Infrastructure Services

Launch all required infrastructure services using Docker Compose:

```bash
# Start all infrastructure services
docker-compose up -d

# Check service status
docker-compose ps
```

This starts:
- **PostgreSQL 16**: Primary database (port 5432)
- **Redis 7**: Caching layer (port 6379)
- **Elasticsearch 8**: Search engine (port 9200)
- **Neo4j 6**: Graph database for recommendations (port 7474)
- **NATS JetStream**: Message streaming (port 4222)
- **Keycloak 25**: Authentication server (port 8080)
- **MinIO**: S3-compatible storage (port 9000)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Monitoring dashboards (port 3001)

#### 4. Database Setup

Initialize the database schema and seed data:

```bash
# Wait for PostgreSQL to be ready
until docker-compose exec postgres pg_isready -U musicstream; do sleep 1; done

# Run database migrations (when available)
npm run db:migrate

# Seed development data (when available)
npm run db:seed
```

#### 5. Start Development Servers

Launch all application services:

```bash
# Start all services in development mode
npm run dev

# Or start individual services:
npm run dev:web          # Web application (port 3000)
npm run dev:auth         # Auth service (port 4001)
npm run dev:catalog      # Catalog service (port 4002)
npm run dev:streaming    # Streaming service (port 4003)
npm run dev:social       # Social service (port 4004)
```

#### 6. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Register new account |
| **Keycloak Admin** | http://localhost:8080/admin/ | admin / admin |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Neo4j Browser** | http://localhost:7474 | neo4j / password |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |

## 🧪 Testing

### Run Test Suites

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests (Playwright)

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### End-to-End Testing

E2E tests use Playwright to simulate real user interactions:

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug specific test
npm run test:e2e -- --debug --grep "music discovery"
```

## 🔧 Development

### Code Quality

We maintain high code quality with automated tools:

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Working with Services

```bash
# Build all services
npm run build

# Build specific service
npm run build:web
npm run build:auth

# Test specific service
npm run test:auth
npm run test:streaming
```

## 📊 Monitoring & Debugging

### Application Metrics

Access monitoring dashboards:

- **Grafana**: http://localhost:3001 (admin/admin)
  - Application metrics
  - Infrastructure health
  - Custom dashboards
  - Alerting rules

### Logs

```bash
# View all service logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f keycloak
```

### Health Checks

```bash
# Check infrastructure health
docker-compose ps

# Check specific services
curl http://localhost:8080/health  # Keycloak
curl http://localhost:9200/_cluster/health  # Elasticsearch
```

## 🚀 Deployment

### Local Production Build

Test production builds locally:

```bash
# Build all services
npm run build

# Start production mode
npm run start:prod
```

### AWS Infrastructure

Deploy to AWS using Terraform:

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply
```

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/playlist-collaboration
   ```

2. **Make Changes**
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation

3. **Test Locally**
   ```bash
   npm run lint
   npm test
   ```

4. **Submit Pull Request**
   - Ensure all CI checks pass
   - Include detailed description
   - Request code review

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages
- **Test Coverage**: Minimum 90% coverage required

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check if ports are in use
netstat -an | grep -E "(3000|4001|4002|4003|4004|5432|6379|8080|9200)"

# Reset Docker containers
docker-compose down -v
docker-compose up -d
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U musicstream -d musicstream
```

**Memory or performance issues:**
```bash
# Check system resources
docker stats

# Restart specific service
docker-compose restart postgres
docker-compose restart redis
```

## 📚 Additional Resources

- **[System Design](./SYSTEM_DESIGN.md)**: Architecture and technical decisions
- **[API Documentation](./api/)**: GraphQL schema and REST endpoints
- **[Infrastructure Guide](./terraform/)**: AWS deployment with Terraform
- **[Testing Guide](./tests/)**: Comprehensive testing strategies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open Source Libraries**: Built on the shoulders of giants
- **Music Industry**: Inspiration from leading streaming platforms
- **Community**: Contributors and beta testers
- **Accessibility**: Following WCAG 2.2 AA guidelines

---

<div align="center">

**[⭐ Star us on GitHub](https://github.com/your-org/music_app)** • **[🐛 Report Bug](https://github.com/your-org/music_app/issues)** • **[💡 Request Feature](https://github.com/your-org/music_app/issues)**

Made with ❤️ for music lovers everywhere

</div> 
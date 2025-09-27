#!/bin/bash

# SARO Production Startup Script
# This script handles the complete startup process for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as root (not recommended for production)
if [ "$EUID" -eq 0 ]; then
    warning "Running as root is not recommended for production"
    warning "Consider creating a dedicated user for the application"
fi

log "🚀 Starting SARO production deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version must be 18 or higher. Current: $(node --version)"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2 globally..."
    npm install -g pm2 || error "Failed to install PM2"
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    error "PostgreSQL is not running. Please start PostgreSQL first: sudo systemctl start postgresql"
fi

# Create logs directory
log "📁 Creating logs directory..."
mkdir -p logs

# Check for environment file
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.template" ]; then
        warning "No .env.production found. Creating from template..."
        cp .env.production.template .env.production
        warning "Please edit .env.production with your actual values before continuing"
        exit 1
    else
        error "No .env.production file found. Please create one with your database credentials."
    fi
fi

# Validate environment variables
log "🔍 Validating environment configuration..."
source .env.production

if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL is not set in .env.production"
fi

if [ -z "$SESSION_SECRET" ]; then
    error "SESSION_SECRET is not set in .env.production"
fi

if [ "$SESSION_SECRET" = "your_very_secure_random_session_secret_here" ]; then
    error "Please change SESSION_SECRET in .env.production to a secure random value"
fi

# Test database connection
log "🔍 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    error "Cannot connect to database. Please check your DATABASE_URL in .env.production"
fi

success "Database connection successful"

# Install dependencies
log "📦 Installing dependencies..."
npm ci --only=production || error "Failed to install dependencies"

# Build application if needed
if [ -f "vite.config.ts" ]; then
    log "🔨 Building application..."
    npm run build || error "Build failed"
fi

# Stop existing PM2 process if running
log "🔄 Stopping existing application..."
pm2 stop saro 2>/dev/null || true
pm2 delete saro 2>/dev/null || true

# Start application with PM2
log "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production || error "Failed to start application with PM2"

# Save PM2 configuration
log "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
log "⚙️  Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | bash || warning "Could not setup PM2 startup script (may require manual setup)"

# Show application status
log "📊 Application status:"
pm2 status saro

# Show logs location
success "Application started successfully!"
log "📝 Logs are available at:"
log "   - Combined: ./logs/saro-combined.log"
log "   - Output:   ./logs/saro-out.log"
log "   - Errors:   ./logs/saro-error.log"

log "📱 Application should be running on port ${PORT:-5000}"
log "🔍 Check status: pm2 status"
log "📋 View logs: pm2 logs saro"
log "🔄 Restart: pm2 restart saro"

# Final health check
sleep 3
if pm2 list | grep -q "saro.*online"; then
    success "🎉 SARO is running successfully!"
else
    error "Application failed to start. Check logs: pm2 logs saro"
fi
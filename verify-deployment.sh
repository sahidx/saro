#!/bin/bash

# SARO Deployment Verification Script
# Run this script after deployment to verify everything is working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
}

test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    log "Testing $description..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        success "$description - Status: $response"
        return 0
    else
        error "$description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

log "🔍 SARO Production Deployment Verification"
log "=========================================="

# Check if application is running
log "Checking PM2 status..."
if pm2 list | grep -q "saro.*online"; then
    success "Application is running in PM2"
else
    error "Application is not running in PM2"
    exit 1
fi

# Get application port
PORT=$(pm2 jlist | grep -A 10 '"name":"saro"' | grep '"PORT"' | sed 's/.*"PORT":"\([^"]*\)".*/\1/' | head -1)
if [ -z "$PORT" ]; then
    PORT=5000
fi

BASE_URL="http://localhost:$PORT"

log "Testing application endpoints on $BASE_URL..."

# Test basic endpoints
test_endpoint "$BASE_URL/api/health" "200" "Health Check"
test_endpoint "$BASE_URL/api/teacher-profiles" "200" "Teacher Profiles"
test_endpoint "$BASE_URL/api/courses" "200" "Courses"

# Test authentication endpoint (should return 401 for unauthenticated)
test_endpoint "$BASE_URL/api/auth/user" "401" "Authentication Check"

# Test batch creation endpoint (should return 401 for unauthenticated)
test_endpoint "$BASE_URL/api/batches" "401" "Batch Creation Endpoint"

log "Testing database connection..."
if pm2 logs saro --lines 50 | grep -q "PostgreSQL connection test successful"; then
    success "Database connection is working"
else
    warning "Could not verify database connection from logs"
fi

log "Checking for any errors in logs..."
ERROR_COUNT=$(pm2 logs saro --lines 100 --err | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    success "No errors found in recent logs"
else
    warning "Found $ERROR_COUNT error(s) in recent logs. Check: pm2 logs saro --err"
fi

log "System resource check..."
MEMORY_USAGE=$(pm2 jlist | grep -A 10 '"name":"saro"' | grep '"memory"' | sed 's/.*"memory":\([^,]*\).*/\1/' | head -1)
if [ ! -z "$MEMORY_USAGE" ]; then
    MEMORY_MB=$((MEMORY_USAGE / 1024 / 1024))
    log "Current memory usage: ${MEMORY_MB}MB"
    if [ "$MEMORY_MB" -lt 400 ]; then
        success "Memory usage is normal"
    else
        warning "Memory usage is high: ${MEMORY_MB}MB"
    fi
fi

log "Checking database tables..."
if command -v psql &> /dev/null && [ -f ".env.production" ]; then
    source .env.production
    TABLES=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
    if [ "$TABLES" -gt 0 ]; then
        success "Database has $TABLES tables"
    else
        warning "No tables found in database"
    fi
else
    warning "Cannot verify database tables (psql not available or .env.production missing)"
fi

log "Firewall status..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        success "UFW firewall is active"
    else
        warning "UFW firewall is not active"
    fi
else
    warning "UFW not available - check firewall configuration manually"
fi

log "SSL/HTTPS check..."
if command -v nginx &> /dev/null; then
    if nginx -t &> /dev/null; then
        success "Nginx configuration is valid"
    else
        warning "Nginx configuration has issues"
    fi
    
    if systemctl is-active --quiet nginx; then
        success "Nginx is running"
    else
        warning "Nginx is not running"
    fi
else
    warning "Nginx not installed - consider setting up reverse proxy"
fi

log "Disk space check..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    success "Disk usage is normal ($DISK_USAGE%)"
else
    warning "Disk usage is high ($DISK_USAGE%)"
fi

log "=========================================="
success "🎉 Verification completed!"
log ""
log "📋 Next steps:"
log "1. Test batch creation through the web interface"
log "2. Create a teacher account and test login"
log "3. Set up regular backups"
log "4. Configure monitoring alerts"
log "5. Set up SSL certificate if not already done"
log ""
log "📖 Useful commands:"
log "- View logs: pm2 logs saro"
log "- Restart app: pm2 restart saro"
log "- Monitor: pm2 monit"
log "- Check status: pm2 status"
#!/bin/bash

# VPS Production Deployment Script for CoachManager
# This script sets up the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting CoachManager VPS Deployment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# 1. Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (Latest LTS)
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
print_status "Installing PM2..."
sudo npm install -g pm2

# 4. Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 5. Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres createuser --interactive --pwprompt coachmanager || true
sudo -u postgres createdb coachmanager_prod --owner=coachmanager || true

# 6. Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# 7. Install SSL certificate tools
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# 8. Create application directory
APP_DIR="/opt/coachmanager"
print_status "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 9. Setup environment file template
print_status "Creating environment template..."
cat > $APP_DIR/.env.template << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://coachmanager:YOUR_PASSWORD@localhost:5432/coachmanager_prod"

# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Session Security
SESSION_SECRET="CHANGE_THIS_TO_SECURE_RANDOM_STRING"

# SMS Configuration
SMS_API_KEY="your_sms_api_key"
SMS_API_URL="your_sms_provider_url"
SMS_SENDER_ID="CoachManager"

# AI Services (Optional)
OPENAI_API_KEY="your_openai_key"
ANTHROPIC_API_KEY="your_anthropic_key"
GEMINI_API_KEY="your_gemini_key"

# File Upload Configuration
UPLOAD_DIR="/opt/coachmanager/uploads"
MAX_FILE_SIZE=10485760

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_email_password"

# Security
ALLOWED_ORIGINS="https://yourdomain.com"
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

# 10. Create Nginx configuration template
print_status "Creating Nginx configuration template..."
sudo tee /etc/nginx/sites-available/coachmanager > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Configuration
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # File Upload Size
    client_max_body_size 10M;
    
    # Static Files
    location /uploads {
        alias /opt/coachmanager/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /assets {
        alias /opt/coachmanager/client/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API Routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Main Application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 11. Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'coachmanager',
    script: './server/index.js',
    cwd: '/opt/coachmanager',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 12. Create deployment script
print_status "Creating deployment script..."
cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying CoachManager..."

# Navigate to application directory
cd /opt/coachmanager

# Pull latest code (if using git)
# git pull origin main

# Install/update dependencies
npm ci --production

# Build client
npm run build

# Run database migrations
npm run db:migrate 2>/dev/null || echo "⚠️  Database migrations skipped"

# Restart application with PM2
pm2 restart coachmanager || pm2 start ecosystem.config.js

echo "✅ Deployment complete!"
EOF

chmod +x $APP_DIR/deploy.sh

# 13. Create logs directory
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/uploads

# 14. Setup firewall
print_status "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 15. Create system user for application
print_status "Creating system user..."
sudo useradd --system --shell /bin/bash --home $APP_DIR coachmanager || true
sudo chown -R coachmanager:coachmanager $APP_DIR

print_status "VPS setup complete! 🎉"
print_warning "Manual steps required:"
echo ""
echo "1. Copy your application code to: $APP_DIR"
echo "2. Configure environment variables in: $APP_DIR/.env"
echo "3. Update Nginx config: sudo nano /etc/nginx/sites-available/coachmanager"
echo "4. Enable Nginx site: sudo ln -s /etc/nginx/sites-available/coachmanager /etc/nginx/sites-enabled/"
echo "5. Test Nginx: sudo nginx -t"
echo "6. Reload Nginx: sudo systemctl reload nginx"
echo "7. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "8. Start application: cd $APP_DIR && ./deploy.sh"
echo "9. Setup PM2 startup: pm2 startup && pm2 save"
echo ""
print_status "Your CoachManager will be ready at: https://yourdomain.com"
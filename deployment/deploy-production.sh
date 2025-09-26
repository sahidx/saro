#!/bin/bash

# Modern Coach Management System - VPS Deployment Script
# Professional Purple Theme - Classes 6-10 System

set -e

echo "🚀 Starting CoachManager VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${PURPLE}[INFO]${NC} $1"
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib nodejs npm certbot python3-certbot-nginx

# Install Node.js 18 LTS (recommended for production)
print_status "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
print_status "Verifying installations..."
node --version
npm --version
psql --version
nginx -v

# Clone or update the repository
REPO_DIR="/var/www/coachmanager"
if [ -d "$REPO_DIR" ]; then
    print_status "Updating existing repository..."
    cd $REPO_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www
    git clone https://github.com/your-username/CoachManager.git $REPO_DIR
    cd $REPO_DIR
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres createdb coachmanager_prod 2>/dev/null || print_warning "Database already exists"

# Create database user (you'll need to set a secure password)
sudo -u postgres psql -c "CREATE USER coachmanager WITH ENCRYPTED PASSWORD 'your_secure_password';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE coachmanager_prod TO coachmanager;" 2>/dev/null || print_warning "Privileges already granted"

# Setup environment variables
print_status "Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://coachmanager:your_secure_password@localhost:5432/coachmanager_prod

# Security
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# AI API Keys (Replace with your actual keys)
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here

# SMS Configuration (Replace with your actual credentials)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Frontend URL
CLIENT_URL=https://your-domain.com
EOF
    print_warning "Created .env file with default values. Please update with your actual credentials!"
else
    print_status "Environment file already exists"
fi

# Run database migrations
print_status "Running database migrations..."
npm run db:migrate || print_warning "Migration failed or not configured"

# Seed initial data
print_status "Seeding initial data..."
npm run db:seed || print_warning "Seeding failed or not configured"

# Build the frontend
print_status "Building frontend..."
cd client
npm run build
cd ..

# Setup Nginx configuration
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/coachmanager << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Serve static files
    location / {
        root $REPO_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # File upload size limit
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/coachmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup PM2 for process management
print_status "Installing and configuring PM2..."
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'coachmanager-server',
    script: './server/index.js',
    cwd: '$REPO_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=4096',
    
    // Monitoring
    min_uptime: '10s',
    max_restarts: 10,
    
    // Auto-restart on file changes in production (disable if needed)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'client/dist']
  }],
  
  deploy: {
    production: {
      user: '$USER',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/CoachManager.git',
      path: '$REPO_DIR',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
EOF

# Create logs directory
mkdir -p logs

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup SSL certificate with Let's Encrypt
print_status "Setting up SSL certificate..."
print_warning "Make sure your domain DNS points to this server before proceeding!"
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME

if [ ! -z "$DOMAIN_NAME" ]; then
    # Update Nginx configuration with actual domain
    sudo sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/coachmanager
    sudo nginx -t && sudo systemctl reload nginx
    
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # Setup auto-renewal
    sudo crontab -l | grep -q certbot || (sudo crontab -l ; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw --force enable

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/coachmanager << EOF
$REPO_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Setup automated backups
print_status "Setting up automated database backups..."
mkdir -p /home/$USER/backups
cat > /home/$USER/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
pg_dump coachmanager_prod | gzip > \$BACKUP_DIR/coachmanager_\$DATE.sql.gz
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/$USER/backup-db.sh
(crontab -l ; echo "0 2 * * * /home/$USER/backup-db.sh") | crontab -

# Create deployment status check
cat > check-status.sh << EOF
#!/bin/bash
echo "🔍 CoachManager System Status"
echo "=============================="
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager

echo ""
echo "🗄️  Database Status:"
sudo systemctl status postgresql --no-pager

echo ""
echo "🔒 SSL Certificate Status:"
sudo certbot certificates

echo ""
echo "💾 Disk Usage:"
df -h

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "🔥 Recent Logs (last 20 lines):"
pm2 logs coachmanager-server --lines 20 --nostream
EOF

chmod +x check-status.sh

# Final status
print_success "🎉 CoachManager deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "• Application: Running on PM2"
echo "• Database: PostgreSQL configured"
echo "• Web Server: Nginx with SSL (if domain configured)"
echo "• Process Manager: PM2 with auto-restart"
echo "• Firewall: UFW configured"
echo "• Backups: Automated daily database backups"
echo "• Logs: Automated rotation configured"
echo ""
echo "🔧 Next Steps:"
echo "==============="
echo "1. Update .env file with your actual API keys and credentials"
echo "2. Configure your domain DNS to point to this server"
echo "3. Run './check-status.sh' to verify system status"
echo "4. Monitor logs: pm2 logs coachmanager-server"
echo "5. Update application: git pull && npm run build && pm2 reload ecosystem.config.js"
echo ""
echo "🌐 Your application should be available at:"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "   https://$DOMAIN_NAME"
else
    echo "   http://$(curl -s ifconfig.me) (Configure domain for HTTPS)"
fi
echo ""
echo "📱 Modern Features Deployed:"
echo "• Three-state attendance system (Present/Excused/Absent)"
echo "• Class-based subject system (6-8: Science/General Math, 9-10: +Higher Math)"
echo "• Modern purple theme (professional education colors)"
echo "• Automated monthly results calculation"
echo "• AI-powered question generation"
echo "• Real-time messaging system"
echo ""
print_success "Happy Teaching! 🎓"
# Modern CoachManager System - VPS Deployment Guide
# Professional Education Management Platform (Classes 6-10)

## 🎯 System Overview

**CoachManager** is a modern, comprehensive coaching management system designed specifically for Bangladeshi educational institutions teaching classes 6-10. The system features:

### ✨ Core Features
- **Three-State Attendance System**: Present, Excused, Absent with intelligent bonus calculation
- **Class-Based Subject Management**: 
  - Classes 6-8: Science, General Mathematics
  - Classes 9-10: Science, General Mathematics, Higher Mathematics
- **AI-Powered Question Generation**: Using Claude/Gemini for Bengali educational content
- **Automated Monthly Results**: Smart calculation including attendance (20%) and bonus (10%)
- **Real-Time Messaging**: WhatsApp integration and internal messaging
- **Modern Purple Theme**: Professional educational interface

### 🏗️ Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Anthropic Claude, Google Gemini
- **Process Management**: PM2 with clustering
- **Web Server**: Nginx with SSL/TLS

---

## 🚀 Quick Deployment

### Prerequisites
- Ubuntu 20.04+ / CentOS 8+ VPS
- Minimum 2GB RAM, 20GB storage
- Domain name with DNS configured
- Basic terminal knowledge

### One-Command Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/CoachManager/main/deployment/deploy-production.sh | bash
```

---

## 📋 Manual Step-by-Step Deployment

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib nodejs npm certbot python3-certbot-nginx

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version  # Should be v18.x.x
npm --version
```

### Step 2: Database Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb coachmanager_prod
sudo -u postgres psql -c "CREATE USER coachmanager WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE coachmanager_prod TO coachmanager;"
```

### Step 3: Application Deployment

```bash
# Clone repository
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/your-username/CoachManager.git coachmanager
cd coachmanager

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Setup environment variables
cp deployment/.env.production .env
# Edit .env with your actual values
nano .env
```

### Step 4: Environment Configuration

Update `.env` file with your actual values:

```env
# Database
DATABASE_URL=postgresql://coachmanager:your_secure_password@localhost:5432/coachmanager_prod

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# AI API Keys
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Get from https://console.anthropic.com/
GOOGLE_AI_API_KEY=AIzaSyC-xxxxx      # Get from https://makersuite.google.com/

# Domain
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# SMS (for messaging features)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_secret
```

### Step 5: Database Migration & Seeding

```bash
# Run migrations
npm run db:migrate

# Seed initial data (subjects, sample users, etc.)
npm run db:seed

# Or manually import SQL dump
psql coachmanager_prod < coachdb_2025-09-08.sql
```

### Step 6: Frontend Build

```bash
# Build optimized frontend
cd client
npm run build
cd ..
```

### Step 7: Nginx Configuration

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/coachmanager << 'EOF'
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
        root /var/www/coachmanager/client/dist;
        try_files $uri $uri/ /index.html;
        
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/coachmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Process Management (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server/index.js --name coachmanager-server --instances max --exec-mode cluster

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the command output instructions
```

### Step 9: SSL Certificate (Let's Encrypt)

```bash
# Replace 'your-domain.com' with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 10: Security & Optimization

```bash
# Setup firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw enable

# Setup log rotation
sudo tee /etc/logrotate.d/coachmanager << 'EOF'
/var/www/coachmanager/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Setup automated backups
mkdir -p /home/$USER/backups
cat > /home/$USER/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump coachmanager_prod | gzip > $BACKUP_DIR/coachmanager_$DATE.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/$USER/backup-db.sh
(crontab -l ; echo "0 2 * * * /home/$USER/backup-db.sh") | crontab -
```

---

## 🛠️ System Management

### Application Commands

```bash
# Start/Stop/Restart
pm2 start coachmanager-server
pm2 stop coachmanager-server
pm2 restart coachmanager-server

# View logs
pm2 logs coachmanager-server
pm2 logs coachmanager-server --lines 100

# Monitor system
pm2 monit

# Update application
cd /var/www/coachmanager
git pull origin main
npm install
cd client && npm run build && cd ..
pm2 restart coachmanager-server
```

### Database Management

```bash
# Backup database
pg_dump coachmanager_prod > backup_$(date +%Y%m%d).sql

# Restore database
psql coachmanager_prod < backup_file.sql

# Connect to database
psql coachmanager_prod -U coachmanager
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs coachmanager-server --lines 50

# Check environment variables
cat .env

# Verify database connection
psql coachmanager_prod -U coachmanager -c "SELECT 1;"
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep coachmanager

# Test connection
psql "postgresql://coachmanager:password@localhost/coachmanager_prod"
```

#### 3. Frontend Not Loading
```bash
# Check if build exists
ls -la client/dist/

# Rebuild frontend
cd client && npm run build && cd ..

# Check Nginx configuration
sudo nginx -t
sudo systemctl status nginx
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --dry-run

# Check Nginx SSL configuration
sudo nginx -t
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Connect to database
\c coachmanager_prod

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM students WHERE class_level = 9;

-- Create indexes for common queries
CREATE INDEX idx_students_class_level ON students(class_level);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_results_month_year ON monthly_results(month, year);
```

#### 2. Application Optimization
```bash
# Monitor memory usage
pm2 monit

# Adjust PM2 configuration for better performance
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'coachmanager-server',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=2048',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

pm2 start ecosystem.config.js
```

#### 3. Nginx Optimization
```nginx
# Add to /etc/nginx/sites-available/coachmanager

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 50M;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

---

## 📊 Monitoring & Maintenance

### System Health Check Script

Create `/var/www/coachmanager/health-check.sh`:

```bash
#!/bin/bash

echo "🏥 CoachManager Health Check"
echo "=========================="

# Check PM2 processes
echo "📊 PM2 Status:"
pm2 jlist | jq '.[] | {name, status, cpu, memory}'

# Check database
echo "🗄️  Database Status:"
if psql coachmanager_prod -U coachmanager -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Connection failed"
fi

# Check disk space
echo "💾 Disk Usage:"
df -h | grep -E "/$|/var"

# Check memory
echo "🧠 Memory Usage:"
free -h

# Check recent logs
echo "📝 Recent Errors (last 10 lines):"
pm2 logs coachmanager-server --lines 10 --nostream | grep -i error || echo "No recent errors"

# Check SSL certificate expiry
echo "🔒 SSL Certificate:"
if command -v certbot &> /dev/null; then
    sudo certbot certificates 2>/dev/null | grep -A2 "Certificate Name" | head -10
fi

echo "✅ Health check completed"
```

### Automated Monitoring

Set up monitoring alerts using tools like:
- **Uptime Robot** (external monitoring)
- **New Relic** or **DataDog** (APM)
- **Grafana + Prometheus** (self-hosted)

### Backup Strategy

```bash
# Create comprehensive backup script
cat > /home/$USER/full-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/coachmanager"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump coachmanager_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup application files (excluding node_modules)
tar --exclude='node_modules' --exclude='.git' --exclude='logs' \
    -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www coachmanager/

# Backup Nginx configuration
sudo cp /etc/nginx/sites-available/coachmanager $BACKUP_DIR/nginx_config_$DATE

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/$USER/full-backup.sh

# Schedule daily backups
(crontab -l ; echo "0 3 * * * /home/$USER/full-backup.sh") | crontab -
```

---

## 🎓 System Features Guide

### Three-State Attendance System
- **Present**: Full attendance credit (100%)
- **Excused**: Attendance credit for bonus calculation only
- **Absent**: No attendance credit

### Class-Based Subject System
- **Classes 6-8**: Science, General Mathematics
- **Classes 9-10**: Science, General Mathematics, Higher Mathematics

### Automated Monthly Results
- **Exam Marks**: 70% weight
- **Attendance**: 20% weight (Present only)
- **Bonus**: 10% weight (Present + Excused)

### AI Question Generation
- Supports Bengali mathematical and scientific content
- Uses Anthropic Claude and Google Gemini
- Generates questions based on Bangladesh curriculum

---

## 📞 Support & Updates

### Getting Help
1. Check the logs: `pm2 logs coachmanager-server`
2. Run health check: `./health-check.sh`
3. Review this documentation
4. Contact system administrator

### Regular Updates
```bash
# Update application
cd /var/www/coachmanager
git pull origin main
npm install
cd client && npm run build && cd ..
pm2 restart coachmanager-server

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm update
cd client && npm update && cd ..
cd server && npm update && cd ..
```

### Security Updates
- Keep system packages updated
- Regularly rotate API keys and secrets
- Monitor SSL certificate expiry
- Review access logs for suspicious activity
- Update Node.js and dependencies regularly

---

## 🎯 Success Indicators

After successful deployment, you should have:

✅ **Application running**: PM2 shows green status  
✅ **Database connected**: Can login and view data  
✅ **SSL certificate**: HTTPS working properly  
✅ **Modern theme**: Purple professional interface  
✅ **Attendance system**: Three-state buttons working  
✅ **Subject filtering**: Class-based subjects display  
✅ **AI integration**: Question generation functional  
✅ **Messaging**: Internal and WhatsApp integration  
✅ **Automated backups**: Daily database backups  
✅ **Monitoring**: Health checks and log rotation  

**🎉 Congratulations! Your modern CoachManager system is now live and ready to enhance educational management for classes 6-10!**
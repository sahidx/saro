# SARO VPS Production Deployment Guide

## 🚀 Complete PostgreSQL VPS Setup Instructions

### Prerequisites
- Ubuntu VPS (20.04+ recommended)
- Root or sudo access
- Domain name (optional)

### Step 1: Install PostgreSQL

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Configure PostgreSQL Database

```bash
# Switch to postgres user and create database
sudo -u postgres psql

# In PostgreSQL console, run:
CREATE USER saro WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE saro_db OWNER saro;
GRANT ALL PRIVILEGES ON DATABASE saro_db TO saro;
ALTER USER saro CREATEDB;
\q
```

### Step 3: Install Node.js and PM2

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version
npm --version
pm2 --version
```

### Step 4: Deploy SARO Application

```bash
# Clone repository
git clone https://github.com/sahidx/saro.git
cd saro

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.production
```

### Step 5: Configure Production Environment

Edit `.env.production`:
```bash
# Production Environment Configuration
NODE_ENV=production
DATABASE_URL=postgresql://saro:your_secure_password_here@localhost:5432/saro_db
PORT=5000
SESSION_SECRET=generate_a_very_secure_random_string_here

# SMS Configuration (Optional)
BULKSMS_API_KEY=your_bulksms_api_key

# AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

### Step 6: Build and Start Application

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 7: Configure Nginx (Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/saro
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
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
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/saro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Certbot (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Step 9: Configure Firewall

```bash
# Setup UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Production Management Commands

### Application Management
```bash
# View application status
pm2 status

# View logs
pm2 logs saro

# Restart application
pm2 restart saro

# Stop application
pm2 stop saro

# Monitor in real-time
pm2 monit
```

### Database Management
```bash
# Connect to database
psql -U saro -d saro_db

# Backup database
pg_dump -U saro saro_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -U saro -d saro_db < backup_file.sql
```

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart application
pm2 restart saro
```

## 🚨 Troubleshooting

### Database Connection Issues
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Verify user permissions: `psql -U saro -d saro_db -c "SELECT current_user;"`
3. Check DATABASE_URL in `.env.production`

### Application Won't Start
1. Check logs: `pm2 logs saro`
2. Verify Node.js version: `node --version` (should be 18+)
3. Check port availability: `sudo netstat -tlnp | grep :5000`

### Permission Issues
1. Check file ownership: `ls -la`
2. Fix ownership: `sudo chown -R $USER:$USER /path/to/saro`

## 📊 Monitoring and Maintenance

### Daily Checks
- Application status: `pm2 status`
- Disk space: `df -h`
- Memory usage: `free -h`

### Weekly Tasks
- Database backup
- System updates: `sudo apt update && sudo apt upgrade`
- Log rotation check

### Monthly Tasks
- SSL certificate renewal (if using Certbot)
- Performance review
- Security updates

## 🎯 Performance Optimization

### Database Optimization
```sql
-- Run these queries periodically to maintain performance
VACUUM ANALYZE;
REINDEX DATABASE saro_db;
```

### PM2 Configuration
The application uses the `ecosystem.config.cjs` file for optimal PM2 configuration:
- Auto-restart on crash
- Memory monitoring
- Log management
- Environment-specific settings

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs saro`
2. Verify database connection
3. Ensure all environment variables are set correctly
4. Check system resources: `htop` or `top`

## 🔐 Security Best Practices

1. **Regular Updates**: Keep system and dependencies updated
2. **Strong Passwords**: Use secure passwords for database and session secret
3. **Firewall**: Only allow necessary ports (80, 443, 22)
4. **SSL**: Always use HTTPS in production
5. **Backups**: Regular database and application backups
6. **Monitoring**: Set up monitoring for uptime and performance

---

**Note**: This application will automatically create all necessary database tables on first startup. No manual database migrations are required.
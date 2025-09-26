# CoachManager - Production Deployment Guide

## 🎯 Overview

CoachManager is a comprehensive student management system with fee collection, SMS notifications, exam management, and messaging capabilities. This guide covers production deployment on a VPS.

## ✨ Features

### Core Features
- **Student Management**: Add, edit, and manage students across multiple batches
- **Fee Collection**: Monthly fee tracking with batch-wise collection interface
- **Exam Management**: Create exams, mark entry, and result management
- **SMS Notifications**: Automated SMS for exam results and notifications
- **Messaging System**: WhatsApp and SMS messaging for students and parents
- **Secure Authentication**: Session-based auth with rate limiting
- **Health Monitoring**: Comprehensive system health checks and metrics

### Production-Ready Features
- **Error Handling**: Comprehensive error handling middleware
- **Database Management**: Automatic database initialization with retry logic
- **Health Monitoring**: Real-time health checks and performance metrics
- **Security**: Helmet security headers, rate limiting, input sanitization
- **SMS Cost Management**: Prevents double-charging for student+parent messages
- **Graceful Shutdown**: Proper resource cleanup on server shutdown

## 🏗️ Architecture

```
CoachManager/
├── client/           # React frontend with Vite
├── server/           # Express.js backend
├── shared/           # Shared types and schemas
├── Production Files/
│   ├── vps-setup.sh              # VPS setup automation
│   ├── .env.production           # Production environment template
│   ├── ecosystem.config.js       # PM2 process management
│   └── validate-production.ts    # Pre-deployment validation
```

## 🚀 Quick Start (Production)

### Prerequisites
- Ubuntu 20.04+ VPS
- Domain name (optional but recommended)
- PostgreSQL credentials
- SMS provider API key (optional)

### 1. Automated VPS Setup
```bash
# Upload files to VPS
scp -r CoachManager/ user@your-server:/tmp/

# Run setup script
ssh user@your-server
cd /tmp/CoachManager/
chmod +x vps-setup.sh
./vps-setup.sh
```

### 2. Manual Configuration
```bash
# Configure environment
cp .env.production .env
nano .env

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/coachmanager
# Replace YOUR_DOMAIN with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/coachmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL (optional but recommended)
sudo certbot --nginx -d yourdomain.com
```

### 3. Deploy Application
```bash
cd /opt/coachmanager
npm ci --production
npm run build
npm start

# Setup PM2 for process management
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coachmanager_prod"

# Server
NODE_ENV=production
PORT=3001
SESSION_SECRET="your-super-secure-session-secret"

# Security
ALLOWED_ORIGINS="https://yourdomain.com"
```

### Optional Environment Variables
```bash
# SMS Configuration
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.yoursms.com/send"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Uploads
UPLOAD_DIR="/opt/coachmanager/uploads"
MAX_FILE_SIZE=10485760

# AI Services (Optional)
OPENAI_API_KEY="sk-your-key"
ANTHROPIC_API_KEY="sk-ant-your-key"
```

## 📋 Pre-Deployment Validation

Run the validation script to ensure production readiness:

```bash
npm run validate-production
```

This checks:
- ✅ Node.js version compatibility
- ✅ Required files presence
- ✅ Environment configuration
- ✅ Production features
- ✅ Fee collection system
- ✅ Dependencies installation
- ✅ Build process
- ✅ Deployment files

## 🎛️ System Management

### Start/Stop Application
```bash
# Start with PM2
pm2 start coachmanager

# Stop application
pm2 stop coachmanager

# Restart application
pm2 restart coachmanager

# View logs
pm2 logs coachmanager
```

### Health Monitoring
```bash
# Basic health check
curl http://localhost:3001/healthz

# Comprehensive health check
curl http://localhost:3001/health

# Performance metrics
curl http://localhost:3001/metrics
```

### Database Management
```bash
# Initialize database (automatic on first run)
npm run production-start

# Manual database push
npm run db:push

# Database migrations
npm run db:migrate
```

## 🗂️ Database Schema

### Core Tables
- **users**: System users (teachers, admins)
- **students**: Student information
- **batches**: Class/batch management
- **exams**: Exam management
- **examResults**: Student exam results
- **studentFees**: Monthly fee tracking (NEW)
- **messages**: SMS/messaging logs

### Fee Collection Features
- Monthly fee tracking per student
- Batch-wise fee collection interface
- Payment status tracking (paid/unpaid/partial)
- Monthly collection summaries

## 📱 SMS Integration

### Supported Features
- Single exam result notifications
- Bulk SMS for batches
- Parent and student notifications
- Cost optimization (no double charging)

### SMS Configuration
```bash
# Environment variables
SMS_API_KEY="your-provider-key"
SMS_API_URL="https://api.provider.com/send"
SMS_SENDER_ID="CoachManager"
```

## 🔐 Security Features

### Implemented Security
- **Helmet**: Security headers (CSP, XSS protection)
- **Rate Limiting**: Login attempts and API calls
- **Input Sanitization**: XSS prevention
- **Session Management**: Secure session handling
- **CORS**: Configured for production domain
- **HTTPS**: SSL/TLS encryption (when configured)

### Security Headers
```
Content-Security-Policy: Comprehensive CSP
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

## 📊 Monitoring & Analytics

### Health Check Endpoints
- `/healthz`: Basic health check
- `/health`: Comprehensive system health
- `/metrics`: Performance metrics

### Monitored Metrics
- Request count and response times
- Error rates and types
- Memory usage and CPU performance
- Database connectivity
- File system health
- SMS service status

## 🚨 Error Handling

### Error Categories
- **ValidationError**: Input validation failures
- **DatabaseError**: Database operation errors
- **SMSError**: SMS service failures
- **AuthError**: Authentication issues
- **NotFoundError**: Resource not found
- **AppError**: General application errors

### Error Logging
All errors are logged with:
- Timestamp and error type
- Request context
- Stack traces (in development)
- User-friendly messages

## 🔄 Backup & Maintenance

### Database Backup
```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated daily backups (setup cron job)
0 2 * * * pg_dump $DATABASE_URL > /opt/coachmanager/backups/backup_$(date +%Y%m%d).sql
```

### Log Rotation
```bash
# PM2 handles log rotation automatically
# Logs location: ~/.pm2/logs/
```

### Updates
```bash
# Update application
cd /opt/coachmanager
git pull origin main  # if using git
npm ci --production
npm run build
pm2 restart coachmanager
```

## 🌐 Domain & SSL Setup

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (automatic with certbot)
sudo systemctl enable certbot.timer
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   # Verify DATABASE_URL in .env
   ```

2. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs coachmanager
   # Verify environment variables
   pm2 env 0
   ```

3. **SMS Not Working**
   ```bash
   # Verify SMS credentials
   # Check SMS provider balance
   # Review SMS logs in application
   ```

4. **High Memory Usage**
   ```bash
   # Monitor with PM2
   pm2 monit
   # Check health endpoint
   curl localhost:3001/health
   ```

### Performance Optimization
- Enable gzip compression (configured in Nginx)
- Use CDN for static assets (optional)
- Database indexing (included in schema)
- PM2 clustering (can be configured)

## 🏷️ Version History

### v1.0.0 (Current)
- ✅ Complete fee collection system
- ✅ SMS cost optimization
- ✅ Production-ready error handling
- ✅ Comprehensive health monitoring
- ✅ VPS deployment automation
- ✅ Security hardening

### Planned Features
- Dashboard analytics
- Email notifications
- Mobile app (PWA)
- Advanced reporting
- Multi-tenant support

## 📧 Contact & Support

For deployment support or issues:
- Check application logs: `pm2 logs coachmanager`
- Review health status: `curl localhost:3001/health`
- Validate configuration: `npm run validate-production`

---

**🎉 Your CoachManager is now ready for production!**

Access your application at: `https://yourdomain.com`
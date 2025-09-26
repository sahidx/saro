# CoachManager Deployment Files
## Professional Education Management System

This directory contains all the necessary files for deploying the CoachManager system to a VPS (Virtual Private Server).

## 📁 Directory Contents

### `deploy-production.sh`
**Automated VPS deployment script** - One-command deployment solution
- Complete server setup and configuration
- Database installation and setup  
- SSL certificate configuration
- PM2 process management setup
- Nginx web server configuration
- Security hardening (firewall, etc.)
- Automated backup configuration
- Health monitoring setup

**Usage:**
```bash
# Make executable and run
chmod +x deploy-production.sh
./deploy-production.sh

# Or run directly from GitHub:
curl -fsSL https://raw.githubusercontent.com/your-repo/CoachManager/main/deployment/deploy-production.sh | bash
```

### `.env.production`
**Production environment configuration template**
- Database connection settings
- API keys for AI services (Claude, Gemini)
- Security secrets (JWT, Session)
- SMS and email configuration
- Performance and feature flags
- Security and monitoring settings

**Setup:**
```bash
# Copy to project root and customize
cp .env.production ../.env
nano ../.env  # Edit with your actual values
```

### `VPS-DEPLOYMENT-GUIDE.md`
**Comprehensive deployment documentation**
- Step-by-step deployment instructions
- System requirements and prerequisites
- Configuration details and examples
- Troubleshooting guide
- Performance optimization tips
- Security best practices
- Maintenance and monitoring procedures

## 🚀 Quick Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+ VPS
- 2GB+ RAM, 20GB+ storage
- Domain name with DNS configured
- Root or sudo access to server

### One-Command Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/CoachManager/main/deployment/deploy-production.sh | bash
```

### Manual Deployment
See `VPS-DEPLOYMENT-GUIDE.md` for detailed step-by-step instructions.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Nginx Proxy   │    │  Node.js Server │
│  (React/Vite)   │◄──►│   (SSL/HTTPS)   │◄──►│    (Express)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │    Database     │
                                               └─────────────────┘
```

## 🔧 System Components

### Web Server (Nginx)
- Reverse proxy for Node.js application
- Static file serving for React build
- SSL/TLS termination with Let's Encrypt
- Gzip compression and caching
- Security headers and rate limiting

### Application Server (Node.js)
- Express.js API server with TypeScript
- PM2 process management with clustering
- Real-time WebSocket support
- AI integration (Claude, Gemini)
- Database ORM with Drizzle

### Database (PostgreSQL)
- Relational database for educational data
- Optimized indexes for performance
- Automated backup with rotation
- Connection pooling and optimization

### Security & Monitoring
- UFW firewall configuration
- SSL certificate auto-renewal
- Log rotation and aggregation
- Health monitoring and alerts
- Automated system updates

## 🎯 Modern Features Deployed

### Three-State Attendance System
- **Present**: Full attendance credit (100%)
- **Excused**: Bonus calculation credit only
- **Absent**: No attendance credit
- Smart calculation for monthly results

### Class-Based Subject Management
- **Classes 6-8**: Science, General Mathematics  
- **Classes 9-10**: Science, General Mathematics, Higher Mathematics
- Dynamic subject filtering based on student class level

### Professional Purple Theme
- Modern educational color scheme
- Consistent branding across all components
- Enhanced visual hierarchy and readability
- Professional appearance for educational institutions

### AI-Powered Features
- Question generation using Claude/Gemini
- Bengali curriculum support
- Automated content creation
- Intelligent tutoring assistance

### Automated Systems
- Monthly result calculation with weighted scoring
- Attendance tracking with bonus calculations  
- Real-time notifications and updates
- Bulk operations for administrative efficiency

## 📊 Performance Specifications

### Recommended Server Specs
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 2GB minimum (4GB+ recommended)  
- **Storage**: 20GB minimum (50GB+ recommended)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04 LTS or newer

### Expected Performance
- **Concurrent Users**: 500-1000+ supported
- **Page Load Time**: <2 seconds
- **API Response**: <500ms average
- **Database Queries**: <100ms average
- **Uptime**: 99.9% availability target

### Scalability Options
- **Horizontal**: Load balancer + multiple servers
- **Vertical**: Upgrade server resources as needed
- **Database**: PostgreSQL clustering for high availability
- **CDN**: Static asset distribution for global performance

## 🔒 Security Features

### Application Security
- JWT authentication with secure token handling
- Role-based access control (Student/Teacher/Admin)
- Input validation and sanitization
- SQL injection prevention with prepared statements
- XSS protection with Content Security Policy

### Infrastructure Security  
- HTTPS enforced with Let's Encrypt SSL
- UFW firewall with restricted access
- Rate limiting and DDoS protection
- Security headers (HSTS, X-Frame-Options, etc.)
- Regular security updates and patches

### Data Protection
- Encrypted database connections
- Secure session management
- Automated encrypted backups
- Audit logging for all operations
- GDPR-compliant data handling

## 📈 Monitoring & Maintenance

### Automated Monitoring
- **Health Checks**: Application and database status
- **Performance Metrics**: Response times, memory usage
- **Log Analysis**: Error tracking and trend analysis
- **Security Monitoring**: Failed login attempts, suspicious activity
- **Backup Verification**: Daily backup integrity checks

### Maintenance Tasks
- **Daily**: Automated backups and health checks
- **Weekly**: Security updates and log review
- **Monthly**: Performance optimization and capacity planning  
- **Quarterly**: Feature updates and system improvements
- **Annually**: Major upgrades and security audits

### Emergency Procedures
- **Backup Restoration**: Step-by-step recovery process
- **Failover**: High availability setup instructions
- **Security Incidents**: Incident response procedures
- **Performance Issues**: Troubleshooting and optimization
- **Data Recovery**: Database recovery and migration

## 📞 Support & Documentation

### Available Documentation
- **User Manual**: Complete guide for all user roles
- **Admin Guide**: System administration procedures
- **API Documentation**: Developer integration reference  
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Operational recommendations

### Getting Help
1. **Check Logs**: `pm2 logs coachmanager-server`
2. **Health Status**: `./check-status.sh`
3. **System Status**: `systemctl status nginx postgresql`
4. **Documentation**: Review deployment guide
5. **Community**: GitHub issues and discussions

## 🎓 Educational Impact

This deployment enables modern educational management for:
- **Coaching Centers**: Specialized for Bangladeshi education system
- **Student Tracking**: Comprehensive performance monitoring
- **Teacher Tools**: Advanced classroom management features
- **Parent Engagement**: Real-time progress updates
- **Administrative Efficiency**: Automated workflows and calculations
- **Data-Driven Decisions**: Analytics and reporting capabilities

## 🚀 Future Enhancements

### Planned Features
- Mobile application (React Native)
- Advanced analytics dashboard
- Online examination system with proctoring
- Payment gateway integration
- Video conferencing integration
- Learning management system (LMS) features

### Scalability Roadmap
- Multi-tenant architecture for coaching chains
- Microservices architecture for enterprise scale
- Advanced AI features for personalized learning
- Integration APIs for third-party educational tools
- International curriculum support expansion

---

**🎯 Ready to deploy your modern education management system? Start with the automated deployment script or follow the detailed guide for a customized setup!**
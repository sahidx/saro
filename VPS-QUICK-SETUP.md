# VPS Deployment Guide - Quick Setup

This guide helps you deploy the Student Management System to any VPS with PostgreSQL.

## Prerequisites

1. **VPS with Ubuntu/Debian**
2. **PostgreSQL installed and running**
3. **Node.js 18+ installed**
4. **Git installed**

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/sahidx/saro.git
cd saro

# Install dependencies
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

Set these required variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
SESSION_SECRET=your-very-secure-random-string-here
PORT=5000
```

## Step 3: Setup Database

**Option A: Automatic Setup (Recommended)**
```bash
# This will create tables and seed initial data
npm run vps:setup
```

**Option B: Manual Setup**
```bash
# Create database manually
createdb your_database_name

# Run setup
npm run db:setup
npm run build
```

## Step 4: Start Application

```bash
# Start in production mode
npm run vps:start

# Or use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

## Step 5: Access Application

- **URL**: `http://your-vps-ip:5000`
- **Admin Login**: `admin / admin123`
- **Change password** after first login

## Key Features

✅ **Automatic Database Setup** - Creates all tables automatically
✅ **Batch Management** - Create Science, Math, Higher Math batches  
✅ **Student Management** - Add/manage students
✅ **No Temporary Data** - All data persists in PostgreSQL
✅ **Error Recovery** - Auto-initializes missing database structures

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U username -d database_name -c "\dt"
```

### Port Issues
```bash
# Check if port 5000 is free
sudo netstat -tlnp | grep :5000

# Use different port in .env
PORT=8080
```

### Permission Issues
```bash
# Give database user proper permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE your_database_name TO username;"
```

## Production Optimizations

1. **Use PM2 for process management**
2. **Setup Nginx reverse proxy**
3. **Enable SSL with Let's Encrypt**
4. **Setup database backups**
5. **Monitor with PM2 monitoring**

## Quick Commands

```bash
# Full deployment from scratch
git clone https://github.com/sahidx/saro.git
cd saro
npm install
cp .env.example .env
# Edit .env with your database settings
npm run vps:setup
npm run vps:start

# Check status
curl http://localhost:5000/health
```

The application will automatically:
- Create database tables if missing
- Seed initial admin user
- Handle batch creation without temporary data
- Provide proper error messages for database issues

Your Student Management System is now ready for production use! 🎉
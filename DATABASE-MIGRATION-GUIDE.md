# 🔄 Database Migration Guide: SQLite → PostgreSQL

## Current Status
- ✅ **Development**: SQLite (file:./dev.sqlite)
- 🎯 **Production**: PostgreSQL (recommended)

## Why Migrate to PostgreSQL for VPS?

### 🚫 SQLite Limitations for Production
- Single-writer limitation (no concurrent writes)
- File corruption risks under load
- No built-in user management
- Performance issues with multiple users
- No replication/backup features
- Not suitable for web applications with multiple concurrent users

### ✅ PostgreSQL Benefits for VPS
- **Concurrent Access**: Multiple teachers/students can use simultaneously
- **Data Integrity**: ACID transactions prevent data corruption
- **Performance**: Optimized for web applications
- **Security**: Role-based access control
- **Backup/Recovery**: Professional database management
- **Scalability**: Can handle growth from 10 to 1000+ users

## 🎯 Recommended VPS Database Setup

### Option 1: Self-Hosted PostgreSQL (Same VPS)
**Best for**: Small to medium coaching centers (up to 200 students)

```bash
# 1. Install PostgreSQL on your VPS
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 2. Create database and user
sudo -u postgres psql
CREATE USER coachmanager WITH PASSWORD 'your_very_secure_password_here';
CREATE DATABASE coachmanager_prod OWNER coachmanager;
GRANT ALL PRIVILEGES ON DATABASE coachmanager_prod TO coachmanager;
\q

# 3. Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/13/main/postgresql.conf
# Change: listen_addresses = 'localhost' to listen_addresses = '*'

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add: host coachmanager_prod coachmanager 0.0.0.0/0 md5

# 4. Restart PostgreSQL
sudo systemctl restart postgresql
```

### Option 2: Managed Database Service (Recommended)
**Best for**: Professional deployment, better reliability

#### Neon (Free Tier Available)
```bash
# 1. Sign up at https://neon.tech
# 2. Create new project: "coachmanager-prod"
# 3. Get connection string like:
DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-1.aws.neon.tech/coachmanager?sslmode=require"
```

#### Supabase (Free Tier Available)
```bash
# 1. Sign up at https://supabase.com
# 2. Create new project: "coachmanager"
# 3. Get connection string from Settings > Database
DATABASE_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres"
```

## 🔧 VPS Environment Configuration

### 1. Production .env Setup
```bash
# Copy production template
cp .env.production .env

# Edit with your database credentials
nano .env
```

**Key Settings:**
```env
# Database (use one of these)
DATABASE_URL="postgresql://coachmanager:secure_password@localhost:5432/coachmanager_prod"
# OR managed service:
DATABASE_URL="postgresql://username:password@managed-host:5432/database"

# Production settings
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Security
SESSION_SECRET="generate_64_character_random_string_here"
ALLOWED_ORIGINS="https://yourdomain.com"

# Features
ENABLE_BULK_SMS=true
ENABLE_AI_FEATURES=true
SMS_API_KEY="your_bangladesh_sms_provider_key"
```

### 2. Database Schema Migration
```bash
# Your app automatically detects PostgreSQL and uses correct schema
npm run db:push  # This will create all tables in PostgreSQL

# Or manual migration:
npm run db:migrate
```

### 3. Initial Data Setup
```bash
# Run the seeding (will work with PostgreSQL automatically)
npm run seed
```

## 🚀 Deployment Commands

### Complete VPS Setup
```bash
# 1. Clone your project
git clone your-repo-url
cd CoachManager-1

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.production .env
# Edit .env with your PostgreSQL credentials

# 4. Setup database
npm run db:push

# 5. Build for production
npm run build

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name coachmanager
pm2 startup
pm2 save
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
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
```

## 📊 Performance Comparison

| Database | Users | Response Time | Reliability | Backup |
|----------|--------|---------------|-------------|---------|
| SQLite | 1-5 | Fast | Low | Manual |
| PostgreSQL (VPS) | 5-200 | Fast | High | Automated |
| PostgreSQL (Managed) | 10-1000+ | Fast | Very High | Professional |

## 🎯 Final Recommendation

**For your coaching center VPS deployment:**

1. **Small Center (< 50 students)**: PostgreSQL on same VPS
2. **Medium Center (50-200 students)**: PostgreSQL on same VPS + regular backups
3. **Large Center (200+ students)**: Managed PostgreSQL service (Neon/Supabase)

**Your app is already configured perfectly** - just change the `DATABASE_URL` in your `.env` file and it will automatically switch from SQLite to PostgreSQL with all features working correctly.
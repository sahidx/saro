#!/bin/bash

# VPS PostgreSQL Setup Script for SARO Project
# Run this script on your VPS after installing PostgreSQL

echo "🚀 Setting up PostgreSQL for SARO project..."

# Create database user 'saro' with password 'saro'
echo "📝 Creating PostgreSQL user 'saro'..."
sudo -u postgres psql -c "CREATE USER saro WITH PASSWORD 'saro' SUPERUSER;" 2>/dev/null || echo "User 'saro' might already exist"

# Create database 'saro_db'
echo "📝 Creating database 'saro_db'..."
sudo -u postgres psql -c "CREATE DATABASE saro_db OWNER saro;" 2>/dev/null || echo "Database 'saro_db' might already exist"

# Grant all privileges
echo "📝 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE saro_db TO saro;"

# Test connection
echo "🔍 Testing database connection..."
psql -U saro -d saro_db -c "SELECT version();" || echo "⚠️ Connection test failed - check your setup"

echo "✅ PostgreSQL setup complete!"
echo "💡 Your DATABASE_URL should be: postgresql://saro:saro@localhost:5432/saro_db"
echo ""
echo "🚀 Next steps:"
echo "1. Set DATABASE_URL=postgresql://saro:saro@localhost:5432/saro_db in your .env file"
echo "2. Run: npm install"
echo "3. Run: npm start"
echo "4. The application will automatically create database tables on first run"
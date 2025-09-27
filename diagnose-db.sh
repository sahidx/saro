#!/bin/bash

# Database Information Gathering Script
# Run this on your VPS to help diagnose the permission issue

echo "🔍 Gathering PostgreSQL information..."
echo "=================================="

echo ""
echo "1. PostgreSQL Service Status:"
sudo systemctl status postgresql --no-pager | head -10

echo ""
echo "2. PostgreSQL Version:"
sudo -u postgres psql -c "SELECT version();" 2>/dev/null || echo "Could not connect as postgres user"

echo ""
echo "3. Current Database User Info:"
if [ ! -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL exists in environment"
    # Extract username from DATABASE_URL
    DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
    echo "Database user from URL: $DB_USER"
else
    echo "DATABASE_URL not found in environment"
fi

echo ""
echo "4. Available Databases:"
sudo -u postgres psql -l 2>/dev/null || echo "Could not list databases"

echo ""
echo "5. User Permissions Check:"
if [ ! -z "$DB_USER" ]; then
    echo "Checking permissions for user: $DB_USER"
    sudo -u postgres psql -c "SELECT rolname, rolsuper, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = '$DB_USER';" 2>/dev/null || echo "Could not check user permissions"
fi

echo ""
echo "6. Schema Permissions:"
sudo -u postgres psql -c "SELECT schema_name, schema_owner FROM information_schema.schemata WHERE schema_name = 'public';" 2>/dev/null || echo "Could not check schema permissions"

echo ""
echo "7. Environment Variables:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: ${DATABASE_URL:0:30}... (truncated for security)"

echo ""
echo "=================================="
echo "✅ Information gathering complete!"
echo ""
echo "Please share this output so I can help fix the permission issue."
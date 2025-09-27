# PostgreSQL Permission Fix for VPS

## The Problem
Error: `"permission denied for schema public"` means your database user doesn't have proper permissions to create tables.

## Quick Fix for VPS

### Step 1: Connect as PostgreSQL superuser
```bash
sudo -u postgres psql
```

### Step 2: Grant permissions to your database user
Replace `your_username` and `your_database` with your actual values:

```sql
-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_username;

-- Grant all privileges on the public schema
GRANT ALL ON SCHEMA public TO your_username;
GRANT CREATE ON SCHEMA public TO your_username;

-- Make user a superuser (easiest solution)
ALTER USER your_username WITH SUPERUSER;

-- Exit PostgreSQL
\q
```

### Step 3: Verify your DATABASE_URL
Make sure your `.env` file has the correct format:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database
```

### Step 4: Deploy and test
```bash
# Pull latest changes
git pull origin main

# Run the setup
npm run vps:setup

# Start the application
npm run vps:start
```

## Alternative: Create a New Superuser

If you want to create a completely new database user with full permissions:

```bash
# Connect as postgres
sudo -u postgres psql

# Create new superuser
CREATE USER saro_admin WITH SUPERUSER PASSWORD 'your_secure_password';

# Create database owned by this user
CREATE DATABASE saro_db OWNER saro_admin;

# Exit
\q
```

Then update your `.env`:
```env
DATABASE_URL=postgresql://saro_admin:your_secure_password@localhost:5432/saro_db
```

## Test Database Connection

You can test if your permissions are working:

```bash
# Test connection with your user
psql -U your_username -d your_database -c "CREATE TABLE test_permissions (id INTEGER); DROP TABLE test_permissions;"
```

If this works without errors, your permissions are correct.

## What the Fix Does

The updated code now:
1. ✅ **Tests permissions first** before trying to create tables
2. ✅ **Uses proper Drizzle migrations** instead of raw SQL
3. ✅ **Provides clear error messages** with troubleshooting steps
4. ✅ **Handles permission errors gracefully**
5. ✅ **Creates initial admin user** automatically

After fixing permissions, batch creation will work perfectly! 🎉
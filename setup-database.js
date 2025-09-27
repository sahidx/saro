#!/usr/bin/env node

/**
 * Database Setup Script for VPS Deployment
 * This script ensures PostgreSQL database is properly initialized
 * Run this script after deploying to VPS: node setup-database.js
 */

import { execSync } from 'child_process';
import 'dotenv/config';

async function setupDatabase() {
  console.log('🚀 Setting up database for VPS deployment...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .env file');
    console.log('Example: DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found');
  
  try {
    // Step 1: Test database connection
    console.log('🔍 Testing database connection...');
    const { db } = await import('./db.js');
    const { sql } = await import('drizzle-orm');
    
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
    
    // Step 2: Run migrations to create tables
    console.log('📋 Creating database tables...');
    try {
      execSync('npm run db:push', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Failed to create tables:', error.message);
      console.log('Trying force migration...');
      
      try {
        execSync('npm run db:push --force', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          timeout: 120000
        });
        console.log('✅ Force migration successful');
      } catch (forceError) {
        console.error('❌ Force migration also failed:', forceError.message);
        throw forceError;
      }
    }
    
    // Step 3: Initialize database with seed data
    console.log('🌱 Initializing database with seed data...');
    const { safeInitializeDatabase } = await import('./production-db.js');
    await safeInitializeDatabase();
    
    // Step 4: Verify setup
    console.log('🔍 Verifying database setup...');
    const { users, batches } = await import('../shared/schema.js');
    
    const userCount = await db.select().from(users).limit(1);
    const batchCount = await db.select().from(batches).limit(1);
    
    console.log('✅ Database verification complete');
    console.log(`📊 Found ${userCount.length > 0 ? 'users' : 'no users'} in database`);
    console.log(`📚 Found ${batchCount.length > 0 ? 'batches' : 'no batches'} in database`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('💡 Your application is ready to handle batch creation and user management');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure PostgreSQL is running: sudo systemctl status postgresql');
    console.log('2. Check if database exists: psql -U username -d database_name -c "\\dt"');
    console.log('3. Verify DATABASE_URL format: postgresql://username:password@host:port/database');
    console.log('4. Check database permissions: user should have CREATE, INSERT, SELECT privileges');
    
    process.exit(1);
  }
}

// Auto-detect if being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };
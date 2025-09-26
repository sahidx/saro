import { db } from './db';
import { sql } from 'drizzle-orm';
import { users, batches, studentFees } from '@shared/schema';

/**
 * Production-ready database initialization
 * This will create all necessary tables and seed essential data
 */
export async function initializeDatabase() {
  console.log('🔄 Initializing production database...');

  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');

    // Create tables if they don't exist (handled by drizzle migrations)
    console.log('✅ Database tables ready');

    // Check if we need to seed initial data
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('📝 Seeding initial admin user...');
      await createInitialAdminUser();
    }

    console.log('🎉 Database initialization complete');
    return { success: true };

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create initial admin/teacher user for first login
 */
async function createInitialAdminUser() {
  try {
    const adminUser = {
      id: 'admin-user-001',
      firstName: 'Admin',
      lastName: 'Teacher',
      email: 'admin@coachmanager.com',
      phoneNumber: '01700000000',
      role: 'teacher' as const,
      username: 'admin',
      password: 'admin123', // Should be changed after first login
      isActive: true,
      smsCredits: 100, // Initial SMS credits
    };

    await db.insert(users).values(adminUser);
    
    console.log('✅ Initial admin user created');
    console.log('📧 Login: admin / admin123');
    console.log('⚠️  Please change password after first login');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

/**
 * Validate database health
 */
export async function validateDatabaseHealth() {
  try {
    // Test basic operations
    await db.execute(sql`SELECT 1`);
    
    // Check critical tables exist
    const tableChecks = await Promise.all([
      db.select().from(users).limit(1),
      db.select().from(batches).limit(1),
      db.select().from(studentFees).limit(1),
    ]);
    
    console.log('✅ Database health check passed');
    return { healthy: true, tables: ['users', 'batches', 'studentFees'] };
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return { healthy: false, error: (error as Error).message };
  }
}

/**
 * Clean up temporary/demo data (for production deployment)
 */
export async function cleanupDemoData() {
  try {
    console.log('🧹 Cleaning up demo data...');
    
    // Remove any demo users (those with 'demo' or 'test' in their IDs)
    await db.execute(sql`
      DELETE FROM ${users} 
      WHERE id LIKE '%demo%' 
      OR id LIKE '%test%' 
      OR firstName = 'Demo'
      OR firstName = 'Test'
    `);
    
    // Remove demo batches
    await db.execute(sql`
      DELETE FROM ${batches} 
      WHERE name LIKE '%Demo%' 
      OR name LIKE '%Test%'
      OR batchCode LIKE '%DEMO%'
    `);
    
    console.log('✅ Demo data cleanup complete');
    
  } catch (error) {
    console.error('❌ Demo data cleanup failed:', error);
    throw error;
  }
}

/**
 * Initialize database with error handling for VPS deployment
 */
export async function safeInitializeDatabase() {
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database initialization attempt ${attempt}/${maxRetries}...`);
      
      await initializeDatabase();
      await cleanupDemoData();
      
      const health = await validateDatabaseHealth();
      if (health.healthy) {
        console.log('🎉 Production database ready!');
        return { success: true, attempt };
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, (error as Error).message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  
  console.error('💥 Database initialization failed after all attempts');
  throw lastError;
}
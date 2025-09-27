import { execSync } from 'child_process';
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Proper database setup using Drizzle migrations
 * This is the correct way to handle database schema creation
 */
export async function setupDatabaseProper() {
  console.log('🚀 Setting up database with proper migrations...');
  
  try {
    // Step 1: Test basic connection first
    console.log('🔍 Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
    
    // Step 2: Check if we have proper permissions
    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS __test_permissions__ (id INTEGER);`);
      await db.execute(sql`DROP TABLE IF EXISTS __test_permissions__;`);
      console.log('✅ Database permissions verified');
    } catch (permError: any) {
      console.error('❌ Permission denied. Please ensure your database user has proper permissions.');
      console.error('Run these commands as postgres superuser:');
      console.error(`GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;`);
      console.error(`GRANT ALL ON SCHEMA public TO your_username;`);
      console.error(`ALTER USER your_username CREATEDB;`);
      throw new Error(`Permission denied: ${permError?.message || 'Unknown error'}`);
    }
    
    // Step 3: Run Drizzle migrations (the proper way)
    console.log('📋 Running Drizzle migrations...');
    try {
      // Force push schema to ensure all tables are created
      execSync('npx drizzle-kit push --force', { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });
      console.log('✅ Database schema created via Drizzle migrations');
    } catch (migrationError: any) {
      console.error('❌ Drizzle migration failed:', migrationError?.message);
      
      // Fallback: Try regular push without force
      try {
        console.log('🔄 Trying regular migration...');
        execSync('npx drizzle-kit push', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          timeout: 120000
        });
        console.log('✅ Regular migration successful');
      } catch (fallbackError: any) {
        throw new Error(`Migration failed: ${fallbackError?.message || 'Unknown error'}`);
      }
    }
    
    // Step 4: Verify essential tables exist
    console.log('🔍 Verifying tables were created...');
    const tables = ['users', 'batches', 'exams', 'questions'];
    
    for (const tableName of tables) {
      try {
        const result = await db.execute(sql.raw(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `));
        
        const exists = result.rows?.[0]?.exists || result[0]?.exists;
        if (exists) {
          console.log(`  ✅ Table '${tableName}' exists`);
        } else {
          console.warn(`  ⚠️ Table '${tableName}' missing`);
        }
      } catch (checkError: any) {
        console.warn(`  ⚠️ Could not verify table '${tableName}':`, checkError?.message);
      }
    }
    
    // Step 5: Create initial admin if no users exist
    await createInitialAdmin();
    
    console.log('🎉 Database setup completed successfully!');
    return { success: true };
    
  } catch (error: any) {
    console.error('💥 Database setup failed:', error.message);
    
    // Provide helpful troubleshooting information
    console.log('\n🔧 Troubleshooting Database Permission Issues:');
    console.log('');
    console.log('1. Connect as postgres superuser and run:');
    console.log('   sudo -u postgres psql');
    console.log('');
    console.log('2. Grant proper permissions to your user:');
    console.log('   GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;');
    console.log('   GRANT ALL ON SCHEMA public TO your_username;');
    console.log('   GRANT CREATE ON SCHEMA public TO your_username;');
    console.log('   ALTER USER your_username CREATEDB;');
    console.log('');
    console.log('3. Or create a new superuser:');
    console.log('   CREATE USER your_username WITH SUPERUSER PASSWORD \'your_password\';');
    console.log('');
    console.log('4. Update your DATABASE_URL with the correct user:');
    console.log('   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database');
    
    throw error;
  }
}

/**
 * Create initial admin user if database is empty
 */
async function createInitialAdmin() {
  try {
    console.log('👤 Checking for existing users...');
    
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'teacher';`);
    const userCount = parseInt(result.rows?.[0]?.count || result[0]?.count || '0');
    
    if (userCount === 0) {
      console.log('👤 Creating initial admin user...');
      
      await db.execute(sql`
        INSERT INTO users (
          id, username, password, first_name, last_name, 
          role, email, phone_number, is_active, sms_credits
        ) VALUES (
          'admin-teacher-001', 'admin', 'admin123', 'Admin', 'Teacher',
          'teacher', 'admin@example.com', '01700000000', true, 100
        );
      `);
      
      console.log('✅ Initial admin user created');
      console.log('📧 Login credentials: admin / admin123');
      console.log('⚠️ Please change password after first login');
    } else {
      console.log(`✅ Found ${userCount} existing teacher(s)`);
    }
    
  } catch (error: any) {
    console.warn('⚠️ Could not create/check admin user:', error?.message);
  }
}
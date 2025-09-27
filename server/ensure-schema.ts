import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Ensure database tables exist by creating them if they don't exist
 * This is a safety net for VPS deployments where migrations might not have run
 */
export async function ensureTablesExist() {
  console.log('🔍 Checking if database tables exist...');
  
  try {
    // Check if the batches table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'batches'
      );
    `;
    
    const result = await db.execute(sql.raw(tableExistsQuery));
    const tablesExist = result.rows?.[0]?.exists || result[0]?.exists;
    
    if (!tablesExist) {
      console.log('📋 Tables do not exist, creating schema...');
      await createDatabaseSchema();
    } else {
      console.log('✅ Database tables exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking table existence:', error);
    // Try to create schema anyway
    await createDatabaseSchema();
  }
}

/**
 * Create essential database tables using raw SQL
 * This ensures the application works even if Drizzle migrations haven't run
 */
async function createDatabaseSchema() {
  console.log('🔨 Creating database tables...');
  
  try {
    // First, try to grant permissions if we have sufficient privileges
    try {
      await db.execute(sql`GRANT ALL ON SCHEMA public TO CURRENT_USER;`);
      await db.execute(sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO CURRENT_USER;`);
      await db.execute(sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;`);
      console.log('✅ Granted database permissions');
    } catch (permError: any) {
      console.warn('⚠️ Could not grant permissions (may already exist):', permError?.message || 'Unknown error');
    }
    
    // Create enums first with better error handling
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('teacher', 'student', 'super_user');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (enumError: any) {
      console.warn('⚠️ user_role enum issue:', enumError?.message || 'Unknown error');
    }
    
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE subject AS ENUM ('science', 'math', 'higher-math');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (enumError: any) {
      console.warn('⚠️ subject enum issue:', enumError?.message || 'Unknown error');
    }
    
    try {
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE batch_status AS ENUM ('active', 'inactive', 'completed');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (enumError: any) {
      console.warn('⚠️ batch_status enum issue:', enumError?.message || 'Unknown error');
    }
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR,
        password VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        role user_role NOT NULL DEFAULT 'student',
        email VARCHAR,
        phone_number VARCHAR,
        student_id VARCHAR,
        student_password VARCHAR,
        parent_phone_number VARCHAR,
        address TEXT,
        institution VARCHAR,
        class_level VARCHAR,
        batch_id VARCHAR,
        admission_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        sms_credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create batches table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS batches (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        subject subject NOT NULL,
        batch_code VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        max_students INTEGER DEFAULT 50,
        current_students INTEGER DEFAULT 0,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        class_time VARCHAR,
        class_days TEXT,
        schedule TEXT,
        status batch_status NOT NULL DEFAULT 'active',
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create other essential tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS exams (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        subject subject,
        class_level VARCHAR,
        total_marks INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 60,
        instructions TEXT,
        is_published BOOLEAN DEFAULT false,
        created_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id VARCHAR,
        question TEXT NOT NULL,
        options JSONB,
        correct_answer VARCHAR,
        marks INTEGER DEFAULT 1,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id VARCHAR,
        sender_id VARCHAR,
        title VARCHAR,
        content TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR,
        batch_id VARCHAR,
        date TIMESTAMP,
        status VARCHAR DEFAULT 'present',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR,
        message TEXT,
        icon VARCHAR,
        user_id VARCHAR,
        related_entity_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes for performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users(batch_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);`);
    
    console.log('✅ Database schema created successfully');
    
    // Create initial admin user if none exists
    await createInitialAdmin();
    
  } catch (error) {
    console.error('❌ Error creating database schema:', error);
    throw error;
  }
}

/**
 * Create initial admin user if no users exist
 */
async function createInitialAdmin() {
  try {
    const existingUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users;`);
    const userCount = parseInt(existingUsers.rows?.[0]?.count || existingUsers[0]?.count || '0');
    
    if (userCount === 0) {
      console.log('👤 Creating initial admin user...');
      
      await db.execute(sql`
        INSERT INTO users (
          id, username, password, first_name, last_name, 
          role, email, phone_number, is_active, sms_credits
        ) VALUES (
          'admin-user-001', 'admin', 'admin123', 'Admin', 'Teacher',
          'teacher', 'admin@example.com', '01700000000', true, 100
        );
      `);
      
      console.log('✅ Initial admin user created');
      console.log('📧 Login: admin / admin123');
      console.log('⚠️  Please change password after first login');
    }
    
  } catch (error) {
    console.warn('⚠️ Could not create initial admin user:', error);
  }
}
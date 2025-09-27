import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Production-ready PostgreSQL table creation
 * No drizzle-kit dependencies - pure SQL approach for VPS deployment
 */
export async function createTablesManually() {
  console.log('🔨 Creating PostgreSQL database tables for production...');
  
  try {
    // Test connection first
    await db.execute(sql`SELECT 1`);
    console.log('✅ PostgreSQL connection test successful');
    
    // Create enums if they don't exist (PostgreSQL specific)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('teacher', 'student', 'super_user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE subject AS ENUM ('science', 'math', 'higher-math');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE batch_status AS ENUM ('active', 'inactive', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
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
    
    // Create activity_logs table (this was causing the foreign key issue)
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
    
    // Create indexes for performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_batch_id ON users(batch_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);`);
    
    console.log('✅ Database tables created successfully');
    
    // Create initial admin user if none exists
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'teacher';`);
    const userCount = parseInt(result.rows?.[0]?.count || result[0]?.count || '0');
    
    if (userCount === 0) {
      await db.execute(sql`
        INSERT INTO users (
          id, username, password, first_name, last_name, 
          role, email, phone_number, is_active, sms_credits
        ) VALUES (
          'admin-teacher-001', 'admin', 'admin123', 'Admin', 'Teacher',
          'teacher', 'admin@example.com', '01700000000', true, 100
        );
      `);
      console.log('✅ Initial admin user created: admin / admin123');
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Manual table creation failed:', error.message);
    throw error;
  }
}

/**
 * Check if essential tables exist in PostgreSQL
 */
export async function checkTablesExist() {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'batches'
      );
    `);
    return result.rows?.[0]?.exists || result[0]?.exists;
  } catch (error) {
    return false;
  }
}
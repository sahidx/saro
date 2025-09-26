import Database from 'better-sqlite3';
import fs from 'fs';

// Initialize SQLite database with basic tables
function initializeSQLite() {
  console.log('🔧 Initializing SQLite database...');
  
  // Remove existing database if it exists
  if (fs.existsSync('dev.sqlite')) {
    fs.unlinkSync('dev.sqlite');
    console.log('🗑️  Removed existing database');
  }
  
  const db = new Database('dev.sqlite');
  
  // Create users table
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      username TEXT,
      password TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      role TEXT DEFAULT 'student' CHECK (role IN ('teacher', 'student', 'super_user')),
      email TEXT,
      sms_credits INTEGER DEFAULT 0,
      student_id TEXT,
      phone_number TEXT,
      parent_phone_number TEXT,
      student_password TEXT,
      address TEXT,
      date_of_birth DATETIME,
      gender TEXT,
      institution TEXT,
      class_level TEXT,
      batch_id TEXT,
      admission_date DATETIME,
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create batches table
  db.exec(`
    CREATE TABLE batches (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      subject TEXT NOT NULL CHECK (subject IN ('science', 'math')),
      batch_code TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      max_students INTEGER DEFAULT 50,
      current_students INTEGER DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      class_time TEXT,
      class_days TEXT,
      schedule TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create exams table
  db.exec(`
    CREATE TABLE exams (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      subject TEXT NOT NULL CHECK (subject IN ('science', 'math')),
      chapter TEXT,
      target_class TEXT,
      description TEXT,
      instructions TEXT,
      exam_date DATETIME,
      duration INTEGER NOT NULL,
      exam_type TEXT NOT NULL,
      exam_mode TEXT NOT NULL,
      batch_id TEXT,
      target_students TEXT, -- JSON as TEXT
      question_source TEXT,
      question_content TEXT,
      question_paper_image TEXT,
      total_marks INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);
  
  // Create questions table
  db.exec(`
    CREATE TABLE questions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      exam_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options TEXT, -- JSON as TEXT
      correct_answer TEXT,
      question_image TEXT,
      drive_link TEXT,
      marks INTEGER DEFAULT 1,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `);
  
  // Create messages table
  db.exec(`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );
  `);
  
  // Create notices table
  db.exec(`
    CREATE TABLE notices (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);
  
  // Create sessions table
  db.exec(`
    CREATE TABLE sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL, -- JSON as TEXT
      expire DATETIME NOT NULL
    );
    CREATE INDEX IDX_session_expire ON sessions(expire);
  `);
  
  // Insert sample teacher user
  db.exec(`
    INSERT INTO users (
      id, username, password, first_name, last_name, role, 
      phone_number, is_active, created_at
    ) VALUES (
      'teacher-golam-sarowar-sir', 
      'golam_sarowar', 
      '$2b$10$YourHashedPasswordHere', -- You should hash this
      'Golam', 
      'Sarowar', 
      'teacher',
      '01762602056',
      1,
      CURRENT_TIMESTAMP
    );
  `);
  
  // Insert sample batch
  db.exec(`
    INSERT INTO batches (
      id, name, subject, batch_code, password, created_by
    ) VALUES (
      'batch-science-demo', 
      'Class 9-10 Science', 
      'science', 
      'SCI2025', 
      'science123', 
      'teacher-golam-sarowar-sir'
    );
  `);
  
  console.log('✅ SQLite database initialized with basic schema and sample data');
  db.close();
}

// Check if this file is being run directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  initializeSQLite();
}

export { initializeSQLite };
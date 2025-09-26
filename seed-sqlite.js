import Database from 'better-sqlite3';

function seedSQLiteDatabase() {
  console.log('🌱 Seeding SQLite database...');
  
  const db = new Database('./dev.sqlite');
  
  try {
    // Insert teacher user
    const teacherId = 'teacher-golam-sarowar-sir';
    const insertTeacher = db.prepare(`
      INSERT INTO users (
        id, username, password, first_name, last_name, role, 
        phone_number, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Math.floor(Date.now() / 1000); // Unix timestamp
    
    insertTeacher.run(
      teacherId,
      'golam_sarowar',
      '$2b$10$YourHashedPasswordHere', // In real app, properly hash this
      'Golam',
      'Sarowar',
      'teacher',
      '01762602056',
      1,
      now,
      now
    );
    
    // Insert batch
    const batchId = 'batch-science-demo';
    const insertBatch = db.prepare(`
      INSERT INTO batches (
        id, name, subject, batch_code, password, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertBatch.run(
      batchId,
      'Class 9-10 Science',
      'science',
      'SCI2025',
      'science123',
      teacherId,
      now,
      now
    );
    
    // Insert sample students
    const insertStudent = db.prepare(`
      INSERT INTO users (
        id, first_name, last_name, role, phone_number, batch_id,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const students = [
      { id: 'student-1', firstName: 'রাহুল', lastName: 'আহমেদ', phone: '01712345678' },
      { id: 'student-2', firstName: 'সারা', lastName: 'খান', phone: '01812345679' },
      { id: 'student-3', firstName: 'করিম', lastName: 'উদদিন', phone: '01912345680' }
    ];
    
    for (const student of students) {
      insertStudent.run(
        student.id,
        student.firstName,
        student.lastName,
        'student',
        student.phone,
        batchId,
        1,
        now,
        now
      );
    }
    
    console.log('✅ SQLite database seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding SQLite database:', error);
  } finally {
    db.close();
  }
}

// Check if this file is being run directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  seedSQLiteDatabase();
}

export { seedSQLiteDatabase };
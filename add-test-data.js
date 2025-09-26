import Database from 'better-sqlite3';

function addTestData() {
  console.log('🧪 Adding test data for batch deletion testing...');
  
  const db = new Database('./dev.sqlite');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Insert test batch for deletion
    const insertBatch = db.prepare(`
      INSERT INTO batches (
        id, name, subject, batch_code, password, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertBatch.run(
      'batch-test-delete',
      'Test Batch for Deletion',
      'math',
      'TEST2025',
      'test123',
      'teacher-golam-sarowar-sir',
      now,
      now
    );
    
    // Insert another batch with students (should not be deletable)
    insertBatch.run(
      'batch-with-students',
      'Batch with Students',
      'science', 
      'STUDENTS2025',
      'students123',
      'teacher-golam-sarowar-sir',
      now,
      now
    );
    
    // Insert a student in the second batch
    const insertStudent = db.prepare(`
      INSERT INTO users (
        id, first_name, last_name, role, phone_number, batch_id,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStudent.run(
      'student-test',
      'Test',
      'Student',
      'student',
      '01700000000',
      'batch-with-students',
      1,
      now,
      now
    );
    
    console.log('✅ Test data added successfully');
    console.log('   - Empty batch: batch-test-delete (should be deletable)');
    console.log('   - Batch with student: batch-with-students (should not be deletable)');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    db.close();
  }
}

addTestData();
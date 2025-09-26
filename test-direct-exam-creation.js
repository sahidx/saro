// Test exam creation directly with SQLite
import Database from 'better-sqlite3';

console.log('🧪 Testing direct exam creation to SQLite...');

function testExamCreation() {
  const db = new Database('./dev.sqlite');
  
  try {
    console.log('📝 Creating exam directly...');
    
    const stmt = db.prepare(`
      INSERT INTO exams (title, subject, chapter, target_class, description, instructions, exam_date, duration, exam_type, exam_mode, batch_id, target_students, question_source, question_content, question_paper_image, total_marks, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      "Test Exam Direct SQL",    // title
      "math",                    // subject
      "Algebra",                 // chapter
      "10",                      // target_class
      "Test exam created directly", // description
      "Read carefully",          // instructions
      Math.floor(Date.now() / 1000), // exam_date (Unix timestamp)
      120,                       // duration
      "written",                 // exam_type
      "offline",                 // exam_mode
      null,                      // batch_id
      null,                      // target_students
      "file_upload",             // question_source
      null,                      // question_content
      null,                      // question_paper_image
      100,                       // total_marks
      1,                         // is_active (1 for true)
      "teacher-test"             // created_by
    );
    
    console.log('✅ Exam created successfully:', result);
    
    // Query back to verify
    const allExams = db.prepare('SELECT * FROM exams').all();
    console.log(`📊 Total exams now in database: ${allExams.length}`);
    
    if (allExams.length > 0) {
      console.log('📄 Sample exam:', allExams[allExams.length - 1]);
    }
    
  } catch (error) {
    console.error('❌ Error creating exam:', error);
  } finally {
    db.close();
  }
}

testExamCreation();
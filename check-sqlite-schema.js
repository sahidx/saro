// Check SQLite database tables and structure
import Database from 'better-sqlite3';

const db = new Database('./dev.sqlite');

console.log('📊 SQLite Database Schema Analysis');
console.log('=====================================\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log('📋 Available Tables:');
tables.forEach(table => {
  console.log(`   - ${table.name}`);
});

console.log('\n📊 Exams table structure:');
try {
  const examStructure = db.prepare("PRAGMA table_info(exams);").all();
  examStructure.forEach(column => {
    console.log(`   ${column.name}: ${column.type} (nullable: ${column.notnull === 0})`);
  });
} catch (error) {
  console.log('   ❌ Exams table does not exist');
}

console.log('\n📊 Check if exams table has any data:');
try {
  const examCount = db.prepare("SELECT COUNT(*) as count FROM exams;").get();
  console.log(`   Total exams: ${examCount.count}`);
  
  if (examCount.count > 0) {
    const sampleExams = db.prepare("SELECT id, title, subject, createdBy FROM exams LIMIT 3;").all();
    console.log('   Sample exams:');
    sampleExams.forEach(exam => {
      console.log(`     - ${exam.id}: ${exam.title} (${exam.subject}) by ${exam.createdBy}`);
    });
  }
} catch (error) {
  console.log('   ❌ Error querying exams:', error.message);
}

console.log('\n🏥 Database health check complete');
db.close();
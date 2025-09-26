import { config } from 'dotenv';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/sqlite-schema';
import { eq, like, or } from 'drizzle-orm';

// Load environment variables
config();

async function quickCleanup() {
  console.log('🧹 Starting quick demo data cleanup...');
  
  try {
    // Initialize SQLite database
    const sqlite = new Database('dev.sqlite');
    const db = drizzle(sqlite, { schema });
    
    console.log('📊 Checking existing data...');
    
    // Check batches
    const batches = await db.select().from(schema.batches);
    console.log(`Found ${batches.length} batches:`);
    batches.forEach(batch => {
      console.log(`  - ${batch.name} (ID: ${batch.id})`);
    });
    
    // Delete demo batches (anything with "HSC Chemistry", "demo", "test", "sample")
    const demoBatches = await db.select().from(schema.batches).where(
      or(
        like(schema.batches.name, '%HSC Chemistry%'),
        like(schema.batches.name, '%Demo%'),
        like(schema.batches.name, '%Test%'),
        like(schema.batches.name, '%Sample%'),
        like(schema.batches.name, '%2025%'),
        like(schema.batches.name, '%Chemistry%')
      )
    );
    
    console.log(`\n🗑️  Found ${demoBatches.length} demo batches to delete`);
    
    for (const batch of demoBatches) {
      console.log(`Deleting batch: ${batch.name}`);
      
      // Delete students in this batch (students are in users table)
      await db.delete(schema.users).where(eq(schema.users.batchId, batch.id));
      
      // Delete exams for this batch
      await db.delete(schema.exams).where(eq(schema.exams.batchId, batch.id));
      
      // Delete batch
      await db.delete(schema.batches).where(eq(schema.batches.id, batch.id));
    }
    
    // Also delete demo students (with demo names) - they're in users table
    const demoStudents = await db.select().from(schema.users).where(
      or(
        like(schema.users.firstName, '%রুমানা%'),
        like(schema.users.firstName, '%তানভীর%'),
        like(schema.users.firstName, '%নাদিয়া%'),
        like(schema.users.firstName, '%মাইফুল%'),
        like(schema.users.firstName, '%Demo%'),
        like(schema.users.firstName, '%Test%')
      )
    );
    
    console.log(`\n👥 Found ${demoStudents.length} demo students to delete`);
    
    for (const student of demoStudents) {
      console.log(`Deleting student: ${student.firstName} ${student.lastName}`);
      await db.delete(schema.users).where(eq(schema.users.id, student.id));
    }
    
    // Final check
    const remainingBatches = await db.select().from(schema.batches);
    const remainingStudents = await db.select().from(schema.users).where(eq(schema.users.role, 'student'));
    
    console.log('\n✅ Cleanup completed!');
    console.log(`Remaining batches: ${remainingBatches.length}`);
    console.log(`Remaining students: ${remainingStudents.length}`);
    
    if (remainingBatches.length > 0) {
      console.log('\nRemaining batches:');
      remainingBatches.forEach(batch => {
        console.log(`  - ${batch.name}`);
      });
    }
    
    sqlite.close();
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

quickCleanup().then(() => {
  console.log('🎉 Demo data cleanup finished!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
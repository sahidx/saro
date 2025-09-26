import { db } from "./db";
import { users, batches } from "@shared/schema";
import { eq } from "drizzle-orm";
import { cleanDemoData } from "./cleanDemoData";

async function setupProductionDatabase() {
  try {
    console.log("🚀 Setting up production database...");

    // First, clean any demo data
    await cleanDemoData();

    // Check if we have any teachers
    const teachers = await db.select().from(users).where(eq(users.role, "teacher"));
    
    if (teachers.length === 0) {
      console.log("📝 No teachers found. Create your first teacher:");
      console.log("   1. Run the application");
      console.log("   2. Go to login page");
      console.log("   3. Use 'Create Account' to register as a teacher");
      console.log("   4. Or manually create teacher in database");
    } else {
      console.log(`✅ Found ${teachers.length} teacher(s)`);
      teachers.forEach((teacher: any) => {
        console.log(`   👨‍🏫 ${teacher.firstName} ${teacher.lastName} (${teacher.phoneNumber})`);
      });
    }

    // Check batches
    const allBatches = await db.select().from(batches);
    console.log(`📚 Found ${allBatches.length} batch(es)`);
    
    allBatches.forEach((batch: any) => {
      console.log(`   📖 ${batch.name} (${batch.batchCode}) - ${batch.currentStudents}/${batch.maxStudents} students`);
    });

    console.log("✅ Production database is ready!");
    console.log("📋 To add data:");
    console.log("   1. Teachers can create batches in teacher dashboard");
    console.log("   2. Teachers can add students to batches");
    console.log("   3. Teachers can manage fees in 'Fee Collection' tab");
    
  } catch (error) {
    console.error("❌ Error setting up production database:", error);
  }
}

if (require.main === module) {
  setupProductionDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
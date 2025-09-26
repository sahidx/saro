import { db } from "./db";
import { users, batches, exams, questions, examSubmissions } from "@shared/schema";
import { eq, like, or, inArray, and } from "drizzle-orm";

export async function cleanDemoData() {
  try {
    console.log("🧹 Starting demo data cleanup...");

    // Remove demo batches (any batch that contains demo keywords)
    const demoBatches = await db.select().from(batches).where(
      or(
        like(batches.name, '%Demo%'),
        like(batches.name, '%Sample%'),
        like(batches.name, '%Test%'),
        like(batches.batchCode, 'DEMO%'),
        like(batches.batchCode, 'TEST%')
      )
    );

    if (demoBatches.length > 0) {
      const demoBatchIds = demoBatches.map((b: any) => b.id);
      
      // Remove demo students from these batches
      const demoStudents = await db.delete(users).where(
        and(
          eq(users.role, 'student'),
          inArray(users.batchId!, demoBatchIds)
        )
      ).returning();
      
      console.log(`🗑️  Removed ${demoStudents.length} demo students`);

      // Remove demo batches
      await db.delete(batches).where(inArray(batches.id, demoBatchIds));
      console.log(`🗑️  Removed ${demoBatches.length} demo batches`);
    }

    // Remove any remaining demo users
    const demoUsers = await db.delete(users).where(
      or(
        like(users.firstName, '%Demo%'),
        like(users.firstName, '%Test%'),
        like(users.lastName, '%Demo%'),
        like(users.lastName, '%Test%'),
        like(users.email, '%demo%'),
        like(users.email, '%test%')
      )
    ).returning();

    console.log(`🗑️  Removed ${demoUsers.length} demo users`);

    // Remove demo exams
    const demoExams = await db.delete(exams).where(
      or(
        like(exams.title, '%Demo%'),
        like(exams.title, '%Test%'),
        like(exams.title, '%Sample%')
      )
    ).returning();

    console.log(`🗑️  Removed ${demoExams.length} demo exams`);

    console.log("✅ Demo data cleanup completed!");
    
  } catch (error) {
    console.error("❌ Error cleaning demo data:", error);
    throw error;
  }
}
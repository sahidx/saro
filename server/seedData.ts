import { cleanDemoData } from "./cleanDemoData";

export async function seedDatabase() {
  // In production, we don't want any automatic seeding
  if (process.env.NODE_ENV === "production") {
    console.log("🚀 Production mode: No automatic seeding");
    return;
  }

  // For development, clean any existing demo data first
  if (process.env.NODE_ENV === "development") {
    console.log("🧹 Development mode: Cleaning demo data...");
    try {
      await cleanDemoData();
      console.log("✅ Demo data cleanup completed");
    } catch (error) {
      console.error("❌ Error cleaning demo data:", error);
      // Continue anyway - this is not critical
    }
  }

  console.log("📝 Note: No automatic data seeding. Use the dashboard to manually add:");
  console.log("   - Teachers (through admin interface)");
  console.log("   - Batches (through teacher dashboard)"); 
  console.log("   - Students (through teacher dashboard)");
  console.log("✅ Database ready for manual data entry");
}
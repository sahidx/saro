import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function addGolamSarowarSir() {
  try {
    console.log("🔧 Adding Golam Sarowar Sir to the database...");
    
    // Check if teacher already exists
    const existingUsers = await db.select().from(users).where(eq(users.phoneNumber, "01762602056"));
    
    if (existingUsers.length > 0) {
      // Update existing user
      await db.update(users)
        .set({
          firstName: "Golam Sarowar",
          lastName: "Sir",
          phoneNumber: "01762602056",
          password: "sir@123@", // Plain text for now
          role: "teacher",
          smsCredits: 1000,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(users.phoneNumber, "01762602056"));
        
      console.log("✅ Teacher updated successfully!");
    } else {
      // Insert new user
      await db.insert(users).values({
        id: "teacher-golam-sarowar-sir",
        firstName: "Golam Sarowar",
        lastName: "Sir",
        phoneNumber: "01762602056",
        password: "sir@123@", // Plain text for now
        role: "teacher",
        smsCredits: 1000,
        isActive: true,
      });
      
      console.log("✅ Teacher created successfully!");
    }
    
    console.log("👨‍🏫 Login Credentials:");
    console.log("📱 Phone/Username: 01762602056");
    console.log("🔐 Password: sir@123@");
    console.log("👤 Name: Golam Sarowar Sir");
    console.log("🎯 Role: Teacher");
    
  } catch (error) {
    console.error("❌ Error adding teacher:", error);
  }
}

addGolamSarowarSir();
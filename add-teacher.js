import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./dev.sqlite');

// Function to add Golam Sarowar Sir
async function addGolamSarowarSir() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('sir@123@', 10);
    
    // Check if teacher already exists
    const checkUser = `SELECT * FROM users WHERE phoneNumber = ? OR id = ?`;
    
    db.get(checkUser, ['01762602056', 'teacher-golam-sarowar-sir'], (err, row) => {
      if (err) {
        console.error('❌ Error checking existing user:', err);
        return;
      }
      
      if (row) {
        // Update existing user
        const updateUser = `
          UPDATE users 
          SET firstName = ?, lastName = ?, phoneNumber = ?, password = ?, role = ?, smsCredits = ?, isActive = ?
          WHERE id = ? OR phoneNumber = ?
        `;
        
        db.run(updateUser, [
          'Golam Sarowar', 'Sir', '01762602056', hashedPassword, 'teacher', 1000, true,
          'teacher-golam-sarowar-sir', '01762602056'
        ], function(updateErr) {
          if (updateErr) {
            console.error('❌ Error updating user:', updateErr);
          } else {
            console.log('✅ Teacher updated successfully!');
            console.log('👨‍🏫 Username: 01762602056');
            console.log('🔐 Password: sir@123@');
            console.log('👤 Name: Golam Sarowar Sir');
          }
          db.close();
        });
      } else {
        // Insert new user
        const insertUser = `
          INSERT INTO users (id, firstName, lastName, phoneNumber, password, role, smsCredits, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        db.run(insertUser, [
          'teacher-golam-sarowar-sir', 'Golam Sarowar', 'Sir', '01762602056', 
          hashedPassword, 'teacher', 1000, true
        ], function(insertErr) {
          if (insertErr) {
            console.error('❌ Error inserting user:', insertErr);
          } else {
            console.log('✅ Teacher created successfully!');
            console.log('👨‍🏫 Username: 01762602056');
            console.log('🔐 Password: sir@123@');
            console.log('👤 Name: Golam Sarowar Sir');
          }
          db.close();
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    db.close();
  }
}

addGolamSarowarSir();
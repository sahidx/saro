const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

// Connect to SQLite database
const db = new Database('dev.sqlite');

async function addAdminAccounts() {
  console.log('🔐 Adding admin accounts to clean database...');

  try {
    // Hash passwords
    const sirPasswordHash = await bcrypt.hash('sir@123@', 10);
    const superAdminPasswordHash = await bcrypt.hash('sahidx@123', 10);

    // Prepare insert statement
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, username, password, first_name, last_name, role, 
        phone_number, email, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // Add Sir account (Teacher)
    const sirId = nanoid();
    insertUser.run(
      sirId,
      '01762602056',           // username (phone)
      sirPasswordHash,         // password hash
      'Belal',                 // first_name
      'Sir',                   // last_name  
      'teacher',               // role
      '01762602056',           // phone_number
      'sir@coachmanager.com',  // email
      1,                       // is_active (boolean as 1)
      now,                     // created_at
      now                      // updated_at
    );

    console.log('✅ Added Sir account (Teacher):');
    console.log('   📱 Phone: 01762602056');
    console.log('   🔑 Password: sir@123@');
    console.log('   👤 Role: Teacher');

    // Add Super Admin account
    const adminId = nanoid();
    insertUser.run(
      adminId,
      '01818291546',             // username (phone)
      superAdminPasswordHash,    // password hash
      'Sahid',                   // first_name
      'Rahman',                  // last_name
      'super_user',              // role
      '01818291546',             // phone_number
      'sahid@coachmanager.com',  // email
      1,                         // is_active (boolean as 1)
      now,                       // created_at
      now                        // updated_at
    );

    console.log('✅ Added Super Admin account:');
    console.log('   📱 Phone: 01818291546');
    console.log('   🔑 Password: sahidx@123');
    console.log('   👤 Role: Super User');

    // Verify accounts were added
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // Show all users
    const allUsers = db.prepare('SELECT username, first_name, last_name, role FROM users').all();
    console.log('\n👥 All users:');
    allUsers.forEach(user => {
      console.log(`   ${user.username} - ${user.first_name} ${user.last_name} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error adding admin accounts:', error.message);
  } finally {
    db.close();
  }
}

// Run the function
addAdminAccounts().then(() => {
  console.log('\n🎉 Admin accounts added successfully!');
  console.log('\n🚀 You can now login with:');
  console.log('   Teacher Login: 01762602056 / sir@123@');
  console.log('   Super Admin Login: 01818291546 / sahidx@123');
}).catch(console.error);
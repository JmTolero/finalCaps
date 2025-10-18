const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runNotificationsMigration() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chill_db',
      multipleStatements: true
    });

    console.log('🔗 Connected to database');

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_notifications_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running notifications table migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Notifications table migration completed successfully!');
    console.log('📊 Created notifications table with sample data');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runNotificationsMigration();

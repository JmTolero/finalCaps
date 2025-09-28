const mysql = require('mysql2/promise');
require('dotenv').config();

const runRatingsMigration = async () => {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chill_db',
      multipleStatements: true
    });

    console.log('🔄 Running flavor ratings migration...');

    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', 'add_flavor_ratings_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Flavor ratings migration completed successfully!');
    console.log('📊 Created flavor_ratings table with rating system');
    console.log('⭐ Added average_rating and total_ratings columns to flavors table');

  } catch (error) {
    console.error('❌ Error running ratings migration:', error);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists, skipping creation...');
    } else if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists, skipping addition...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the migration
runRatingsMigration()
  .then(() => {
    console.log('🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });

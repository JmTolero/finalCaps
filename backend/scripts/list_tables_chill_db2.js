const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function listTables() {
  let connection;
  
  // Get connection parameters
  const dbConfig = {
    host: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'VaaDzRgKSOcxWaFTtmOMFKhOpAjEzUMi',
    port: parseInt(process.env.DB_PORT || '55748', 10),
  };
  
  console.log('🔌 Database Connection Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Password: ${dbConfig.password ? '***' : '(empty)'}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: chill_db2\n`);
  
  try {
    // First, connect without specifying database to test connection
    console.log('📡 Attempting to connect to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Successfully connected to MySQL server!\n');

    // Check if chill_db2 database exists
    console.log('🔍 Checking if database "chill_db2" exists...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE "chill_db2"');
    
    if (databases.length === 0) {
      console.log('❌ Database "chill_db2" does not exist.\n');
      
      // List available databases
      console.log('📋 Available databases:');
      const [allDatabases] = await connection.execute('SHOW DATABASES');
      allDatabases.forEach((db, index) => {
        const dbName = db[Object.keys(db)[0]];
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${dbName}`);
      });
      
      await connection.end();
      process.exit(1);
    }
    
    console.log('✅ Database "chill_db2" exists!\n');
    
    // Now connect to the specific database
    await connection.end();
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'chill_db2'
    });
    
    console.log('✅ Connected to database: chill_db2\n');
    console.log('📋 LIST OF TABLES IN chill_db2:');
    console.log('='.repeat(50));

    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Get the column name (it varies based on database name)
    const tableKey = `Tables_in_chill_db2`;
    
    if (tables.length === 0) {
      console.log('\n❌ No tables found in chill_db2');
    } else {
      console.log(`\nTotal tables: ${tables.length}\n`);
      tables.forEach((table, index) => {
        const tableName = table[tableKey];
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${tableName}`);
      });
    }

    // Also check for views
    console.log('\n\n📊 LIST OF VIEWS IN chill_db2:');
    console.log('='.repeat(50));
    
    try {
      const [views] = await connection.execute(
        "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'chill_db2'"
      );
      
      if (views.length === 0) {
        console.log('\n❌ No views found in chill_db2');
      } else {
        console.log(`\nTotal views: ${views.length}\n`);
        views.forEach((view, index) => {
          console.log(`${(index + 1).toString().padStart(3, ' ')}. ${view.TABLE_NAME}`);
        });
      }
    } catch (viewError) {
      console.log(`\n⚠️  Could not retrieve views: ${viewError.message}`);
    }

    await connection.end();
    console.log('\n✅ Query completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error connecting to database:');
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error message: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Check your MySQL username and password in the .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Tip: Database "chill_db2" might not exist. Please verify the database name.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
      console.error('   Try: net start MySQL80 (Windows) or sudo service mysql start (Linux/Mac)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Tip: Connection timeout. Check if the host and port are correct.');
    }
    
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore errors when closing failed connection
      }
    }
    process.exit(1);
  }
}

listTables();


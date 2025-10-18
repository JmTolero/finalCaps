const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  let connection;
  
  try {
    // Create connection to MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',  // Update this with your MySQL password if needed
      database: 'chill_db'
    });

    console.log('✅ Connected to MySQL database: chill_db');
    console.log('\n📊 Checking actual database structure...\n');

    // Check users table structure
    console.log('👤 USERS TABLE:');
    console.log('================');
    const [userColumns] = await connection.execute('DESCRIBE users');
    userColumns.forEach(col => {
      const highlight = col.Field.includes('address') ? '🏠 ' : '   ';
      console.log(`${highlight}${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
    });

    console.log('\n🏪 VENDORS TABLE:');
    console.log('==================');
    const [vendorColumns] = await connection.execute('DESCRIBE vendors');
    vendorColumns.forEach(col => {
      const highlight = col.Field.includes('address') ? '🏠 ' : '   ';
      console.log(`${highlight}${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
    });

    console.log('\n📍 ADDRESSES TABLE:');
    console.log('====================');
    try {
      const [addressColumns] = await connection.execute('DESCRIBE addresses');
      addressColumns.forEach(col => {
        console.log(`   ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ Addresses table does not exist or is not accessible');
    }

    console.log('\n🔗 USER_ADDRESSES TABLE:');
    console.log('==========================');
    try {
      const [userAddressColumns] = await connection.execute('DESCRIBE user_addresses');
      userAddressColumns.forEach(col => {
        console.log(`   ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ User_addresses table does not exist or is not accessible');
    }

    // Check for primary_address_id specifically
    console.log('\n🔍 PRIMARY ADDRESS ANALYSIS:');
    console.log('==============================');
    
    const userHasPrimary = userColumns.some(col => col.Field === 'primary_address_id');
    const vendorHasPrimary = vendorColumns.some(col => col.Field === 'primary_address_id');
    const vendorHasAddress = vendorColumns.some(col => col.Field === 'address_id');
    
    console.log(`Users table has primary_address_id:   ${userHasPrimary ? '✅ YES' : '❌ NO'}`);
    console.log(`Vendors table has primary_address_id: ${vendorHasPrimary ? '✅ YES' : '❌ NO'}`);
    console.log(`Vendors table has address_id:         ${vendorHasAddress ? '✅ YES' : '❌ NO'}`);

    if (!userHasPrimary || !vendorHasPrimary) {
      console.log('\n💡 RECOMMENDATION:');
      console.log('===================');
      if (!userHasPrimary) {
        console.log('- Add primary_address_id column to users table');
      }
      if (!vendorHasPrimary && vendorHasAddress) {
        console.log('- Rename address_id to primary_address_id in vendors table');
      } else if (!vendorHasPrimary) {
        console.log('- Add primary_address_id column to vendors table');
      }
    } else {
      console.log('\n✅ PRIMARY ADDRESS COLUMNS ARE PROPERLY SET UP!');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Update the MySQL password in this script (line 8)');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Tip: Make sure the database "chill_db" exists');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkDatabaseStructure();


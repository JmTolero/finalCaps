const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkUnusedTables() {
  let connection;
  
  const dbConfig = {
    host: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'VaaDzRgKSOcxWaFTtmOMFKhOpAjEzUMi',
    port: parseInt(process.env.DB_PORT || '55748', 10),
    database: 'chill_db2'
  };
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database: chill_db2\n');
    
    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    const tableKey = 'Tables_in_chill_db2';
    const tableNames = tables.map(t => t[tableKey]);
    
    console.log(`📋 Checking ${tableNames.length} tables for usage...\n`);
    
    const results = [];
    const codebaseDir = path.join(__dirname, '..', '..');
    
    // Check each table
    for (const tableName of tableNames) {
      // Skip views
      if (tableName === 'payment_summary' || tableName === 'vendor_delivery_zones') {
        continue;
      }
      
      // Get row count
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const rowCount = count[0].count;
      
      // Search codebase using grep (much faster)
      let foundInCode = false;
      let fileCount = 0;
      
      try {
        // Use grep to search for table name (case-insensitive, word boundary)
        const grepPattern = `\\b${tableName}\\b`;
        const result = execSync(
          `grep -ril "${grepPattern}" "${codebaseDir}/backend" "${codebaseDir}/frontend" 2>nul || echo ""`,
          { encoding: 'utf8', cwd: codebaseDir, maxBuffer: 10 * 1024 * 1024 }
        );
        
        if (result && result.trim()) {
          foundInCode = true;
          fileCount = result.trim().split('\n').filter(line => line.trim()).length;
        }
      } catch (err) {
        // If grep fails, try alternative method
        try {
          // Try with findstr on Windows
          const result = execSync(
            `findstr /s /i /m "${tableName}" "${codebaseDir}\\backend\\*.*" "${codebaseDir}\\frontend\\*.*" 2>nul || echo ""`,
            { encoding: 'utf8', cwd: codebaseDir, maxBuffer: 10 * 1024 * 1024 }
          );
          if (result && result.trim()) {
            foundInCode = true;
            fileCount = result.trim().split('\n').filter(line => line.trim()).length;
          }
        } catch (err2) {
          // Skip if both methods fail
        }
      }
      
      results.push({
        tableName,
        rowCount,
        foundInCode,
        fileCount
      });
      
      // Progress indicator
      process.stdout.write(`   Checking: ${tableName.padEnd(35)} ${foundInCode ? '✓' : '✗'}\r`);
    }
    
    console.log('\n'); // New line after progress
    
    // Separate results
    const usedTables = results.filter(r => r.foundInCode);
    const unusedTables = results.filter(r => !r.foundInCode);
    const emptyTables = results.filter(r => r.rowCount === 0);
    const unusedEmptyTables = results.filter(r => !r.foundInCode && r.rowCount === 0);
    const unusedWithData = results.filter(r => !r.foundInCode && r.rowCount > 0);
    
    // Display results
    console.log('='.repeat(80));
    console.log('📊 ANALYSIS RESULTS:\n');
    
    console.log(`✅ USED TABLES (${usedTables.length}):`);
    console.log('-'.repeat(80));
    usedTables.forEach(t => {
      console.log(`   ${t.tableName.padEnd(35)} | Rows: ${String(t.rowCount).padStart(6)} | Found in ${t.fileCount} file(s)`);
    });
    
    console.log(`\n❌ UNUSED TABLES (${unusedTables.length}):`);
    console.log('-'.repeat(80));
    if (unusedTables.length > 0) {
      unusedTables.forEach(t => {
        const status = t.rowCount === 0 ? 'EMPTY' : `${t.rowCount} rows`;
        console.log(`   ${t.tableName.padEnd(35)} | ${status}`);
      });
    } else {
      console.log('   (None - all tables are being used!)');
    }
    
    if (unusedWithData.length > 0) {
      console.log(`\n⚠️  UNUSED TABLES WITH DATA (${unusedWithData.length}):`);
      console.log('-'.repeat(80));
      unusedWithData.forEach(t => {
        console.log(`   ${t.tableName.padEnd(35)} | ${t.rowCount} rows (WARNING: Has data but not referenced in code!)`);
      });
    }
    
    if (unusedEmptyTables.length > 0) {
      console.log(`\n🗑️  UNUSED & EMPTY TABLES (safe to delete) (${unusedEmptyTables.length}):`);
      console.log('-'.repeat(80));
      unusedEmptyTables.forEach(t => {
        console.log(`   ${t.tableName}`);
      });
    }
    
    await connection.end();
    console.log('\n✅ Analysis completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkUnusedTables();



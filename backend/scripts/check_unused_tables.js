const mysql = require('mysql2/promise');
const fs = require('fs');
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
    console.log('='.repeat(80));
    
    const results = [];
    
    // Check each table
    for (const tableName of tableNames) {
      // Skip views (we'll check those separately)
      if (tableName === 'payment_summary' || tableName === 'vendor_delivery_zones') {
        continue;
      }
      
      // Get row count
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const rowCount = count[0].count;
      
      // Search codebase for table name references
      const codebaseDir = path.join(__dirname, '..', '..');
      const searchPattern = new RegExp(`\\b${tableName}\\b`, 'i');
      
      let foundInCode = false;
      const foundInFiles = [];
      
      // Search in backend directory
      const backendDir = path.join(codebaseDir, 'backend');
      const frontendDir = path.join(codebaseDir, 'frontend');
      
      // Search function
      function searchInDirectory(dir, relativePath = '') {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            // Skip node_modules and other unnecessary directories
            if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
              continue;
            }
            
            if (stat.isDirectory()) {
              searchInDirectory(fullPath, relPath);
            } else if (stat.isFile()) {
              // Check common code file extensions
              const ext = path.extname(item);
              if (['.js', '.jsx', '.ts', '.tsx', '.sql', '.json'].includes(ext)) {
                try {
                  const content = fs.readFileSync(fullPath, 'utf8');
                  if (searchPattern.test(content)) {
                    foundInCode = true;
                    foundInFiles.push(relPath);
                  }
                } catch (err) {
                  // Skip files that can't be read
                }
              }
            }
          }
        } catch (err) {
          // Skip directories that can't be read
        }
      }
      
      // Search in backend and frontend
      if (fs.existsSync(backendDir)) {
        searchInDirectory(backendDir, 'backend');
      }
      if (fs.existsSync(frontendDir)) {
        searchInDirectory(frontendDir, 'frontend');
      }
      
      results.push({
        tableName,
        rowCount,
        foundInCode,
        foundInFiles: foundInFiles.slice(0, 5) // Limit to 5 files
      });
    }
    
    // Separate results
    const usedTables = results.filter(r => r.foundInCode);
    const unusedTables = results.filter(r => !r.foundInCode);
    const emptyTables = results.filter(r => r.rowCount === 0);
    const unusedEmptyTables = results.filter(r => !r.foundInCode && r.rowCount === 0);
    
    // Display results
    console.log('\n📊 ANALYSIS RESULTS:\n');
    
    console.log(`✅ USED TABLES (${usedTables.length}):`);
    console.log('='.repeat(80));
    usedTables.forEach(t => {
      console.log(`   ${t.tableName.padEnd(35)} | Rows: ${String(t.rowCount).padStart(6)} | Found in ${t.foundInFiles.length} file(s)`);
    });
    
    console.log(`\n❌ UNUSED TABLES (${unusedTables.length}):`);
    console.log('='.repeat(80));
    unusedTables.forEach(t => {
      const status = t.rowCount === 0 ? 'EMPTY' : `${t.rowCount} rows`;
      console.log(`   ${t.tableName.padEnd(35)} | ${status}`);
    });
    
    console.log(`\n⚠️  EMPTY TABLES (${emptyTables.length}):`);
    console.log('='.repeat(80));
    emptyTables.forEach(t => {
      const status = t.foundInCode ? 'USED in code' : 'NOT USED';
      console.log(`   ${t.tableName.padEnd(35)} | ${status}`);
    });
    
    console.log(`\n🗑️  UNUSED & EMPTY (safe to delete) (${unusedEmptyTables.length}):`);
    console.log('='.repeat(80));
    unusedEmptyTables.forEach(t => {
      console.log(`   ${t.tableName}`);
    });
    
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

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Recursive function to find all code files
function findCodeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip node_modules, .git, dist, build, etc.
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file.startsWith('.')) {
      return;
    }
    
    if (stat.isDirectory()) {
      findCodeFiles(filePath, fileList);
    } else {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.sql'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

async function findUnusedTables() {
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
    const tableNames = tables.map(t => t[tableKey]).filter(t => t !== 'payment_summary' && t !== 'vendor_delivery_zones');
    
    console.log(`📋 Checking ${tableNames.length} tables...\n`);
    
    const codebaseDir = path.join(__dirname, '..', '..');
    
    // Find all code files
    console.log('📁 Scanning codebase for table references...\n');
    const backendDir = path.join(codebaseDir, 'backend');
    const frontendDir = path.join(codebaseDir, 'frontend');
    
    const codeFiles = [];
    if (fs.existsSync(backendDir)) {
      findCodeFiles(backendDir, codeFiles);
    }
    if (fs.existsSync(frontendDir)) {
      findCodeFiles(frontendDir, codeFiles);
    }
    
    console.log(`   Found ${codeFiles.length} code files to scan\n`);
    
    const results = [];
    
    // Check each table
    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      process.stdout.write(`\r   [${i + 1}/${tableNames.length}] Checking: ${tableName.padEnd(35)}`);
      
      // Get row count
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      const rowCount = count[0].count;
      
      // Search in code files
      let foundInCode = false;
      let fileCount = 0;
      
      for (const file of codeFiles) {
        try {
          const filePath = path.join(codebaseDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Use word boundary regex
          const regex = new RegExp(`\\b${tableName}\\b`, 'i');
          if (regex.test(content)) {
            foundInCode = true;
            fileCount++;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
      
      results.push({
        tableName,
        rowCount,
        foundInCode,
        fileCount
      });
    }
    
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 ANALYSIS RESULTS:\n');
    
    // Separate results
    const usedTables = results.filter(r => r.foundInCode).sort((a, b) => b.fileCount - a.fileCount);
    const unusedTables = results.filter(r => !r.foundInCode).sort((a, b) => b.rowCount - a.rowCount);
    const unusedEmptyTables = unusedTables.filter(r => r.rowCount === 0);
    const unusedWithData = unusedTables.filter(r => r.rowCount > 0);
    
    console.log(`✅ USED TABLES (${usedTables.length}):`);
    console.log('-'.repeat(80));
    usedTables.forEach(t => {
      console.log(`   ${t.tableName.padEnd(35)} | Rows: ${String(t.rowCount).padStart(6)} | Found in ${t.fileCount} file(s)`);
    });
    
    if (unusedTables.length > 0) {
      console.log(`\n❌ UNUSED TABLES (${unusedTables.length}):`);
      console.log('-'.repeat(80));
      unusedTables.forEach(t => {
        const status = t.rowCount === 0 ? 'EMPTY ⚠️' : `${t.rowCount} rows`;
        console.log(`   ${t.tableName.padEnd(35)} | ${status}`);
      });
    } else {
      console.log('\n✅ All tables are being used!');
    }
    
    if (unusedWithData.length > 0) {
      console.log(`\n⚠️  UNUSED TABLES WITH DATA (${unusedWithData.length}) - INVESTIGATE:`);
      console.log('-'.repeat(80));
      unusedWithData.forEach(t => {
        console.log(`   ${t.tableName.padEnd(35)} | ${t.rowCount} rows (Has data but not referenced in code!)`);
      });
    }
    
    if (unusedEmptyTables.length > 0) {
      console.log(`\n🗑️  UNUSED & EMPTY TABLES (${unusedEmptyTables.length}) - Safe to delete:`);
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
    console.error(error.stack);
    if (connection) await connection.end();
    process.exit(1);
  }
}

findUnusedTables();

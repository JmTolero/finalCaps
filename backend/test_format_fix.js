const pool = require('./src/db/config.js');

async function testSoldCountFormat() {
  try {
    console.log('=== Testing sold count format fix ===');
    
    // Simulate the calculation
    const calculatedSoldCount = "0"; // This comes from database as string
    const additionalSoldCount = 1; // This comes from database as number
    
    console.log('Before fix:');
    console.log(`calculatedSoldCount: "${calculatedSoldCount}" (type: ${typeof calculatedSoldCount})`);
    console.log(`additionalSoldCount: ${additionalSoldCount} (type: ${typeof additionalSoldCount})`);
    console.log(`Result with +: "${calculatedSoldCount + additionalSoldCount}"`);
    
    console.log('\nAfter fix:');
    console.log(`parseInt(calculatedSoldCount): ${parseInt(calculatedSoldCount)} (type: ${typeof parseInt(calculatedSoldCount)})`);
    console.log(`parseInt(additionalSoldCount): ${parseInt(additionalSoldCount)} (type: ${typeof parseInt(additionalSoldCount)})`);
    console.log(`Result with parseInt: ${parseInt(calculatedSoldCount) + parseInt(additionalSoldCount)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testSoldCountFormat().catch(console.error);

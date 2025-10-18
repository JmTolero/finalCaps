const pool = require('./src/db/config');

async function checkPricingData() {
  try {
    console.log('Checking complete pricing data for vendors...');
    
    // Check which vendors have all three sizes
    const [completePricing] = await pool.query(`
      SELECT vendor_id, 
             COUNT(*) as size_count,
             GROUP_CONCAT(drum_size ORDER BY drum_size) as sizes,
             GROUP_CONCAT(price ORDER BY drum_size) as prices
      FROM vendor_drum_pricing 
      GROUP BY vendor_id 
      HAVING COUNT(*) = 3
    `);
    
    console.log('\nVendors with complete pricing (all 3 sizes):');
    console.table(completePricing);

    // Check which vendors are missing sizes
    const [incompletePricing] = await pool.query(`
      SELECT vendor_id, 
             COUNT(*) as size_count,
             GROUP_CONCAT(drum_size ORDER BY drum_size) as sizes,
             GROUP_CONCAT(price ORDER BY drum_size) as prices
      FROM vendor_drum_pricing 
      GROUP BY vendor_id 
      HAVING COUNT(*) < 3
    `);
    
    console.log('\nVendors with incomplete pricing:');
    console.table(incompletePricing);

    // Check published flavors and their vendor pricing
    const [flavorsWithPricing] = await pool.query(`
      SELECT f.flavor_id, f.flavor_name, f.vendor_id, v.store_name, v.status,
             COUNT(vdp.drum_size) as pricing_count,
             GROUP_CONCAT(CONCAT(vdp.drum_size, ':', vdp.price) ORDER BY vdp.drum_size) as pricing
      FROM flavors f
      LEFT JOIN vendors v ON f.vendor_id = v.vendor_id
      LEFT JOIN vendor_drum_pricing vdp ON f.vendor_id = vdp.vendor_id
      WHERE f.store_status = 'published'
      GROUP BY f.flavor_id, f.flavor_name, f.vendor_id, v.store_name, v.status
    `);
    
    console.log('\nPublished flavors and their pricing:');
    console.table(flavorsWithPricing);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkPricingData();

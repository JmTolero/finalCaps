const pool = require('../src/db/config');

async function initVendorDrumPricing() {
  try {
    console.log('Initializing vendor drum pricing...');
    
    // Get all vendors that don't have drum pricing
    const [vendorsWithoutPricing] = await pool.query(`
      SELECT v.vendor_id, v.store_name
      FROM vendors v
      LEFT JOIN vendor_drum_pricing vdp ON v.vendor_id = vdp.vendor_id
      WHERE v.status = 'approved' AND vdp.vendor_id IS NULL
      GROUP BY v.vendor_id, v.store_name
    `);
    
    console.log(`Found ${vendorsWithoutPricing.length} vendors without drum pricing`);
    
    for (const vendor of vendorsWithoutPricing) {
      console.log(`Initializing pricing for vendor ${vendor.vendor_id} (${vendor.store_name})`);
      
      // Insert default pricing for all sizes
      await pool.query(`
        INSERT INTO vendor_drum_pricing (vendor_id, drum_size, price, stock, gallons)
        VALUES 
          (?, 'small', 2000, 2, 3),
          (?, 'medium', 2500, 2, 5),
          (?, 'large', 3000, 1, 8)
      `, [vendor.vendor_id, vendor.vendor_id, vendor.vendor_id]);
      
      console.log(`✅ Initialized pricing for vendor ${vendor.vendor_id}`);
    }
    
    // Also update vendors that have pricing but with 0 stock
    console.log('\nChecking for vendors with 0 stock...');
    const [vendorsWithZeroStock] = await pool.query(`
      SELECT v.vendor_id, v.store_name, 
             SUM(CASE WHEN vdp.drum_size = 'small' THEN vdp.stock ELSE 0 END) as total_small,
             SUM(CASE WHEN vdp.drum_size = 'medium' THEN vdp.stock ELSE 0 END) as total_medium,
             SUM(CASE WHEN vdp.drum_size = 'large' THEN vdp.stock ELSE 0 END) as total_large
      FROM vendors v
      INNER JOIN vendor_drum_pricing vdp ON v.vendor_id = vdp.vendor_id
      WHERE v.status = 'approved'
      GROUP BY v.vendor_id, v.store_name
      HAVING (total_small + total_medium + total_large) = 0
    `);
    
    console.log(`Found ${vendorsWithZeroStock.length} vendors with 0 stock total`);
    
    for (const vendor of vendorsWithZeroStock) {
      console.log(`Updating stock for vendor ${vendor.vendor_id} (${vendor.store_name})`);
      
      // Update stock to default values
      await pool.query(`
        UPDATE vendor_drum_pricing 
        SET stock = CASE 
          WHEN drum_size = 'small' THEN 2
          WHEN drum_size = 'medium' THEN 2
          WHEN drum_size = 'large' THEN 1
        END
        WHERE vendor_id = ?
      `, [vendor.vendor_id]);
      
      console.log(`✅ Updated stock for vendor ${vendor.vendor_id}`);
    }
    
    // Check vendor 37 specifically
    const [vendor37] = await pool.query(`
      SELECT * FROM vendor_drum_pricing WHERE vendor_id = 37
    `);
    
    console.log('\nVendor 37 drum pricing:');
    console.table(vendor37);
    
  } catch (error) {
    console.error('Error initializing vendor drum pricing:', error);
  } finally {
    pool.end();
  }
}

initVendorDrumPricing();

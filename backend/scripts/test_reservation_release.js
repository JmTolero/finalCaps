// Test script for reservation auto-release functionality
// Usage: node scripts/test_reservation_release.js

const pool = require('../src/db/config');
const { releaseExpiredReservations, releaseReservation } = require('../src/services/reservationReleaseJob');

async function testReservationRelease() {
  console.log('🧪 Testing Reservation Auto-Release System\n');
  
  try {
    // Test 1: Check for expired reservations
    console.log('Test 1: Checking for expired reservations...');
    await releaseExpiredReservations();
    
    // Test 2: Create a test order with past expiry (if needed)
    console.log('\nTest 2: Testing with specific order ID...');
    console.log('To test with a specific order, uncomment the line below and provide order_id:');
    console.log('// await releaseReservation(YOUR_ORDER_ID);');
    
    // Test 3: Check current expired orders
    console.log('\nTest 3: Listing expired orders...');
    const now = new Date();
    const [expiredOrders] = await pool.query(`
      SELECT 
        order_id, 
        status, 
        payment_status, 
        reservation_expires_at,
        delivery_datetime,
        TIMESTAMPDIFF(MINUTE, reservation_expires_at, NOW()) as minutes_expired
      FROM orders
      WHERE status = 'pending' 
      AND payment_status = 'unpaid'
      AND reservation_expires_at IS NOT NULL
      AND reservation_expires_at < ?
      ORDER BY reservation_expires_at DESC
      LIMIT 10
    `, [now]);
    
    if (expiredOrders.length > 0) {
      console.log(`Found ${expiredOrders.length} expired order(s):`);
      expiredOrders.forEach(order => {
        console.log(`  - Order #${order.order_id}: Expired ${Math.abs(order.minutes_expired)} minutes ago`);
        console.log(`    Expiry: ${order.reservation_expires_at}`);
        console.log(`    Delivery: ${order.delivery_datetime}`);
      });
      
      console.log('\n✅ Running auto-release on these orders...');
      await releaseExpiredReservations();
    } else {
      console.log('ℹ️ No expired orders found at this time.');
    }
    
    // Test 4: Check inventory before/after
    console.log('\nTest 4: Checking inventory states...');
    const [allReservations] = await pool.query(`
      SELECT 
        dda.vendor_id,
        dda.delivery_date,
        dda.drum_size,
        dda.total_capacity,
        dda.reserved_count,
        dda.booked_count,
        dda.available_count,
        COUNT(o.order_id) as pending_orders
      FROM daily_drum_availability dda
      LEFT JOIN orders o ON o.vendor_id = dda.vendor_id 
        AND DATE(o.delivery_datetime) = dda.delivery_date
        AND o.status = 'pending'
        AND o.payment_status = 'unpaid'
      WHERE dda.reserved_count > 0
      GROUP BY dda.availability_id
      LIMIT 10
    `);
    
    if (allReservations.length > 0) {
      console.log(`Found ${allReservations.length} availability record(s) with reservations:`);
      allReservations.forEach(rec => {
        console.log(`  Vendor ${rec.vendor_id}, ${rec.delivery_date}, ${rec.drum_size}:`);
        console.log(`    Total: ${rec.total_capacity}, Reserved: ${rec.reserved_count}, Booked: ${rec.booked_count}, Available: ${rec.available_count}`);
        console.log(`    Pending orders: ${rec.pending_orders}`);
      });
    } else {
      console.log('ℹ️ No reservations found in inventory records.');
    }
    
    console.log('\n✅ Testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testReservationRelease();

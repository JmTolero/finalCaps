const pool = require('../db/config');
const cron = require('node-cron');

/**
 * Auto-release expired reservations
 * 
 * This job runs every 5 minutes and releases reservations for orders where:
 * - Payment has not been received
 * - Reservation has expired (24 hours before delivery time)
 * 
 * Reservation expiry is calculated as: delivery_datetime - 24 hours
 * This ensures vendors have 24 hours to prepare orders after payment.
 */
async function releaseExpiredReservations() {
  try {
    console.log('🔄 Checking for expired reservations...');
    
    const now = new Date();
    
    // Find expired orders (pending or confirmed) that haven't been paid
    // Include both 'pending' and 'confirmed' status because vendors might
    // manually confirm orders before payment, but we still need to release
    // reservations if payment isn't received by the deadline (24hrs before delivery)
    const [expiredOrders] = await pool.query(`
      SELECT order_id, reservation_expires_at, status, payment_status
      FROM orders
      WHERE status IN ('pending', 'confirmed')
      AND payment_status = 'unpaid'
      AND reservation_expires_at IS NOT NULL
      AND reservation_expires_at < ?
    `, [now]);
    
    if (expiredOrders.length === 0) {
      console.log('ℹ️ No expired reservations found');
      return;
    }
    
    console.log(`Found ${expiredOrders.length} expired reservation(s)`);
    
    for (const order of expiredOrders) {
      await releaseReservation(order.order_id, order.status);
    }
    
    console.log(`✅ Released ${expiredOrders.length} expired reservation(s)`);
  } catch (error) {
    console.error('❌ Error releasing expired reservations:', error);
  }
}

/**
 * Release a single reservation by returning reserved drums to available inventory
 * and cancelling the order with an appropriate message.
 * 
 * This is called when a reservation expires (24 hours before delivery time)
 * and payment has not been received.
 */
async function releaseReservation(orderId, currentStatus = 'pending') {
  try {
    console.log(`Releasing reservation for order #${orderId} (current status: ${currentStatus})...`);
    
    // Get order items
    const [items] = await pool.query(`
      SELECT oi.quantity, cd.size, o.delivery_datetime, o.vendor_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN container_drum cd ON oi.containerDrum_id = cd.drum_id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    if (items.length === 0) {
      console.log(`ℹ️ No items found for order #${orderId}`);
      return;
    }
    
    // Return reserved drums to available
    for (const item of items) {
      const deliveryDate = new Date(item.delivery_datetime).toISOString().split('T')[0];
      
      const [result] = await pool.query(`
        UPDATE daily_drum_availability
        SET reserved_count = reserved_count - ?,
            available_count = available_count + ?
        WHERE vendor_id = ? AND delivery_date = ? AND drum_size = ?
      `, [item.quantity, item.quantity, item.vendor_id, deliveryDate, item.size]);
      
      if (result.affectedRows > 0) {
        console.log(`↩️ Released ${item.quantity} ${item.size} drum(s) from order #${orderId} back to available`);
      } else {
        console.warn(`⚠️ Failed to release drums for order #${orderId} - record may not exist`);
      }
    }
    
    // Cancel the order with appropriate message based on status
    let declineReason;
    if (currentStatus === 'confirmed') {
      declineReason = 'Order was confirmed but payment was not received before reservation deadline (24hrs before delivery). Reservation has been released and order cancelled.';
    } else {
      declineReason = 'Payment not received before reservation deadline (24hrs before delivery). Reservation has been released and order cancelled.';
    }
    
    await pool.query(`
      UPDATE orders
      SET status = 'cancelled',
          decline_reason = ?
      WHERE order_id = ?
    `, [declineReason, orderId]);
    
    console.log(`✅ Order #${orderId} cancelled and reservation released (was ${currentStatus})`);
  } catch (error) {
    console.error(`❌ Error releasing reservation for order #${orderId}:`, error);
  }
}

// Run every 5 minutes
if (typeof cron !== 'undefined' && cron.schedule) {
  cron.schedule('*/5 * * * *', releaseExpiredReservations);
  console.log('🔄 Reservation release job started - running every 5 minutes');
} else {
  console.warn('⚠️ Cron not available - reservation release job not started');
}

module.exports = { releaseExpiredReservations, releaseReservation };


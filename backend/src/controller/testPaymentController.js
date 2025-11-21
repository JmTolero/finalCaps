const pool = require('../db/config');
const { createNotification } = require('./shared/notificationController');

/**
 * Test endpoint to manually mark payment as completed
 * This simulates what the Xendit webhook would do
 * FOR TESTING ONLY - Remove in production
 */
const markPaymentCompleted = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { isRemainingPayment = false, isPartialPayment = false, amount } = req.body;
    
    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    console.log('🧪 TEST: Marking payment as completed for order:', order_id, {
      isRemainingPayment,
      isPartialPayment,
      amount
    });

    // Get order details
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE order_id = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];
    const totalAmount = parseFloat(order.total_amount || 0);
    const existingPaymentAmount = parseFloat(order.payment_amount || 0);
    const existingRemainingBalance = parseFloat(order.remaining_balance || 0);
    const remainingPaymentMethod = order.remaining_payment_method?.toLowerCase();
    
    // If this is a remaining balance payment, check the payment method
    if (isRemainingPayment) {
      const remainingAmount = amount || existingRemainingBalance || (totalAmount - existingPaymentAmount);
      const newPaymentAmount = existingPaymentAmount + remainingAmount;
      
      console.log('🧪 TEST: Remaining balance payment:', {
        existingPaymentAmount,
        remainingAmount,
        newPaymentAmount,
        totalAmount,
        remainingPaymentMethod
      });
      
      // Only mark as fully paid if payment method is GCash (not COD)
      // For COD, vendor needs to confirm payment collection manually
      if (remainingPaymentMethod === 'gcash') {
        // Update order to fully paid (GCash remaining balance)
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'paid', 
               payment_amount = ?,
               remaining_balance = 0,
               status = CASE 
                 WHEN status = 'pending' THEN 'confirmed'
                 ELSE status
               END,
               payment_method = 'gcash_integrated'
           WHERE order_id = ?`,
          [newPaymentAmount, order_id]
        );
      } else {
        // For COD, don't mark as paid - vendor needs to confirm manually
        console.log('🧪 TEST: COD remaining balance - vendor must confirm payment collection manually');
        return res.json({
          success: false,
          message: `This order has COD remaining balance. Please use the "Mark Remaining Balance as Paid (COD)" button in the vendor dashboard to confirm payment collection.`,
          order: {
            order_id: order_id,
            payment_status: order.payment_status,
            remaining_balance: existingRemainingBalance,
            remaining_payment_method: remainingPaymentMethod
          }
        });
      }
      
      // Also update payment_intents table if exists
      try {
        await pool.execute(
          `UPDATE payment_intents 
           SET status = 'PAID'
           WHERE order_id = ?`,
          [order_id]
        );
      } catch (err) {
        console.log('No payment_intents record to update (this is fine)');
      }
      
      // Create notifications for vendor and customer
      try {
        const { vendor_id, customer_id } = order;
        
        // Get vendor's user_id
        const [vendorUser] = await pool.execute(
          `SELECT user_id FROM vendors WHERE vendor_id = ?`,
          [vendor_id]
        );

        if (vendorUser.length > 0) {
          const vendorUserId = vendorUser[0].user_id;
          
          // Calculate vendor earnings for the REMAINING BALANCE only (97% of remaining amount)
          const remainingVendorEarnings = remainingAmount * 0.97;
          const remainingPlatformFee = remainingAmount * 0.03;
          
          // Remaining balance payment notification for vendor
          await createNotification({
            user_id: vendorUserId,
            user_type: 'vendor',
            title: 'Remaining Balance Payment Received',
            message: `You received ₱${remainingVendorEarnings.toFixed(2)} (97% of ₱${remainingAmount.toFixed(2)}) for order #${order_id}. Remaining balance completed. Money sent to your GCash.`,
            notification_type: 'payment_confirmed',
            related_order_id: parseInt(order_id),
            related_vendor_id: vendor_id,
            related_customer_id: customer_id
          });

          // Remaining balance payment notification for customer
          if (customer_id) {
            await createNotification({
              user_id: customer_id,
              user_type: 'customer',
              title: 'Remaining Balance Payment Confirmed',
              message: `Your remaining balance payment of ₱${remainingAmount.toFixed(2)} for order #${order_id} has been confirmed. Full payment completed.`,
              notification_type: 'payment_confirmed',
              related_order_id: parseInt(order_id),
              related_vendor_id: vendor_id,
              related_customer_id: customer_id
            });
          }
        }
      } catch (notificationError) {
        console.error('❌ Failed to create notifications:', notificationError);
        // Don't fail the payment update if notification creation fails
      }
      
      console.log(`✅ TEST: Order ${order_id} marked as fully paid (remaining balance completed)`);
      
      return res.json({
        success: true,
        message: `Order ${order_id} remaining balance payment completed`,
        order: {
          order_id: order_id,
          previous_status: order.status,
          previous_payment_status: order.payment_status,
          new_status: order.status === 'pending' ? 'confirmed' : order.status,
          new_payment_status: 'paid',
          payment_amount: newPaymentAmount,
          remaining_balance: 0,
          is_partial: false
        }
      });
    }
    
    // Check if this should be a partial payment (50%)
    // Get the payment intent amount to determine what was actually paid
    const [paymentIntents] = await pool.execute(
      `SELECT amount, metadata FROM payment_intents WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
      [order_id]
    );
    
    let paidAmount = amount || existingPaymentAmount;
    if (paymentIntents.length > 0 && !amount) {
      paidAmount = parseFloat(paymentIntents[0].amount || 0);
    }
    
    // If order has initial_payment_method = 'GCash', it's a 50% payment order
    const is50PercentOrder = order.initial_payment_method === 'GCash';
    
    // Determine if this is a 50% partial payment
    const isPartial = isPartialPayment || is50PercentOrder || 
                            (totalAmount > 0 && 
                             paidAmount > 0 && 
                             paidAmount < totalAmount &&
                             Math.abs(paidAmount - totalAmount * 0.5) < totalAmount * 0.01);
    
    const newPaymentStatus = isPartial ? 'partial' : 'paid';
    
    // Calculate final amounts
    let finalPaymentAmount;
    let remainingBalance;
    
    if (isPartial) {
      // Use the paid amount if available, otherwise calculate 50%
      finalPaymentAmount = paidAmount > 0 ? paidAmount : (totalAmount * 0.5);
      remainingBalance = totalAmount - finalPaymentAmount;
    } else {
      // Full payment
      finalPaymentAmount = totalAmount;
      remainingBalance = 0;
    }

    console.log('🧪 TEST: Payment details:', {
      totalAmount,
      paidAmount,
      existingPaymentAmount,
      isPartialPayment,
      newPaymentStatus,
      finalPaymentAmount,
      remainingBalance
    });

    // Update order status - simulate successful payment
    await pool.execute(
      `UPDATE orders 
       SET payment_status = ?, 
           payment_amount = ?,
           remaining_balance = ?,
           status = CASE 
             WHEN status = 'pending' THEN 'confirmed'
             ELSE status
           END,
           payment_method = 'gcash_integrated'
       WHERE order_id = ?`,
      [newPaymentStatus, finalPaymentAmount, remainingBalance, order_id]
    );

    // Also update payment_intents table if exists
    try {
      await pool.execute(
        `UPDATE payment_intents 
         SET status = 'PAID'
         WHERE order_id = ?`,
        [order_id]
      );
    } catch (err) {
      console.log('No payment_intents record to update (this is fine)');
    }

    // Create notifications for vendor and customer
    try {
      const { vendor_id, customer_id } = order;
      
      // Get vendor's user_id
      const [vendorUser] = await pool.execute(
        `SELECT user_id FROM vendors WHERE vendor_id = ?`,
        [vendor_id]
      );

      if (vendorUser.length > 0) {
        const vendorUserId = vendorUser[0].user_id;
        
        // Calculate vendor earnings (97% of payment amount)
        const vendorEarnings = finalPaymentAmount * 0.97;
        const platformFee = finalPaymentAmount * 0.03;
        
        if (isPartial) {
          // Partial payment notification for vendor
          await createNotification({
            user_id: vendorUserId,
            user_type: 'vendor',
            title: 'Partial Payment Received',
            message: `You received ₱${vendorEarnings.toFixed(2)} (97% of ₱${finalPaymentAmount.toFixed(2)}) for order #${order_id}. Remaining balance: ₱${remainingBalance.toFixed(2)}. Money sent to your GCash.`,
            notification_type: 'payment_confirmed',
            related_order_id: parseInt(order_id),
            related_vendor_id: vendor_id,
            related_customer_id: customer_id
          });

          // Partial payment notification for customer
          if (customer_id) {
            await createNotification({
              user_id: customer_id,
              user_type: 'customer',
              title: 'Partial Payment Confirmed',
              message: `Your partial payment of ₱${finalPaymentAmount.toFixed(2)} for order #${order_id} has been confirmed. Remaining balance of ₱${remainingBalance.toFixed(2)} is due on delivery.`,
              notification_type: 'payment_confirmed',
              related_order_id: parseInt(order_id),
              related_vendor_id: vendor_id,
              related_customer_id: customer_id
            });
          }
        } else {
          // Full payment notification for vendor
          await createNotification({
            user_id: vendorUserId,
            user_type: 'vendor',
            title: 'Payment Received',
            message: `You received ₱${vendorEarnings.toFixed(2)} (97% of ₱${finalPaymentAmount.toFixed(2)}) for order #${order_id}. Money sent to your GCash.`,
            notification_type: 'payment_confirmed',
            related_order_id: parseInt(order_id),
            related_vendor_id: vendor_id,
            related_customer_id: customer_id
          });

          // Full payment notification for customer
          if (customer_id) {
            await createNotification({
              user_id: customer_id,
              user_type: 'customer',
              title: 'Payment Confirmed',
              message: `Your payment of ₱${finalPaymentAmount.toFixed(2)} for order #${order_id} has been confirmed. The vendor will now start preparing your order.`,
              notification_type: 'payment_confirmed',
              related_order_id: parseInt(order_id),
              related_vendor_id: vendor_id,
              related_customer_id: customer_id
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('❌ Failed to create notifications:', notificationError);
      // Don't fail the payment update if notification creation fails
    }

    console.log(`✅ TEST: Order ${order_id} marked as ${newPaymentStatus} and confirmed`);

    res.json({
      success: true,
      message: `Order ${order_id} payment marked as ${newPaymentStatus}`,
      order: {
        order_id: order_id,
        previous_status: order.status,
        previous_payment_status: order.payment_status,
        new_status: order.status === 'pending' ? 'confirmed' : order.status,
        new_payment_status: newPaymentStatus,
        payment_amount: finalPaymentAmount,
        remaining_balance: remainingBalance,
        is_partial: isPartial
      }
    });

  } catch (error) {
    console.error('❌ Error marking payment as completed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark payment as completed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Test endpoint to check order payment status
 */
const checkOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;

    const [orders] = await pool.execute(
      `SELECT order_id, status, payment_status, payment_method, total_amount, created_at 
       FROM orders WHERE order_id = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Also check payment_intents
    const [paymentIntents] = await pool.execute(
      `SELECT * FROM payment_intents WHERE order_id = ?`,
      [order_id]
    );

    res.json({
      success: true,
      order: orders[0],
      payment_intent: paymentIntents[0] || null
    });

  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check order status'
    });
  }
};

module.exports = {
  markPaymentCompleted,
  checkOrderStatus
};

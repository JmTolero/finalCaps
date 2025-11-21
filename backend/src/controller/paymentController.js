const xenditService = require('../services/xenditService');
const pool = require('../db/config');
const { createNotification } = require('./shared/notificationController');

/**
 * Create a payment invoice for GCash payment
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'PHP', 
      description, 
      order_id,
      customer_id,
      vendor_id,
      delivery_fee = 0,
      items = [],
      customer_name,
      customer_email,
      customer_phone
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Create invoice with Xendit
    const invoice = await xenditService.createInvoice({
      amount: parseFloat(amount),
      currency,
      description: description || `Order #${order_id} - Ice Cream Delivery`,
      order_id,
      customer_id: customer_id || null,
      vendor_id: vendor_id || null,
      delivery_fee: parseFloat(delivery_fee),
      items: items.map(item => ({
        name: item.name || item.flavor_name || 'Ice Cream',
        quantity: item.quantity || 1,
        price: item.price || 0,
        category: 'Food & Beverage'
      })),
      items_count: items.length.toString(),
      items_summary: items.map(item => `${item.name || item.flavor_name || 'Item'} x${item.quantity || 1}`).join(', '),
      customer_name: customer_name || 'Customer',
      customer_email: customer_email || 'customer@example.com',
      customer_phone: customer_phone || '+639123456789'
    });

    // Store invoice in database
    try {
      await pool.execute(
        `INSERT INTO payment_intents (
          payment_intent_id, 
          order_id, 
          customer_id, 
          vendor_id, 
          amount, 
          currency, 
          status, 
          payment_method, 
          metadata, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          invoice.id,
          order_id,
          customer_id || null,
          vendor_id || null,
          parseFloat(amount),
          currency,
          invoice.status,
          'gcash',
          JSON.stringify({
            external_id: invoice.external_id,
            invoice_url: invoice.invoice_url,
            items_count: items.length,
            items_summary: items.map(item => `${item.name || item.flavor_name || 'Item'} x${item.quantity || 1}`).join(', ')
          }),
        ]
      );
    } catch (dbError) {
      console.error('Database error storing invoice:', dbError);
      // Continue even if database storage fails
    }

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        external_id: invoice.external_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date
      }
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get invoice status
 */
const getPaymentIntentStatus = async (req, res) => {
  try {
    const { payment_intent_id } = req.params;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID is required'
      });
    }

    // Get invoice from Xendit
    const invoice = await xenditService.getInvoiceStatus(payment_intent_id);

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        external_id: invoice.external_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
        paid_at: invoice.paid_at,
        created: invoice.created,
        metadata: invoice.metadata || {}
      }
    });

  } catch (error) {
    console.error('Get invoice status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Handle Xendit webhook events
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-xendit-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!xenditService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const webhookData = req.body;
    const processedEvent = xenditService.handleWebhook(webhookData);

    // Update invoice status in database
    try {
      await pool.execute(
        `UPDATE payment_intents 
         SET status = ?, updated_at = NOW() 
         WHERE payment_intent_id = ?`,
        [processedEvent.status, processedEvent.invoice_id]
      );

      // If payment succeeded, update order status
      if (processedEvent.status === 'PAID') {
        const orderId = processedEvent.metadata?.order_id;
        
        // Get order details to check if it's a partial payment (50%)
        const [orderDetails] = await pool.execute(
          `SELECT total_amount, payment_amount, payment_status, status 
           FROM orders 
           WHERE order_id = ?`,
          [orderId]
        );
        
        if (orderDetails.length > 0) {
          const order = orderDetails[0];
          const totalAmount = parseFloat(order.total_amount);
          const existingPaymentAmount = parseFloat(order.payment_amount || 0);
          const invoiceAmount = parseFloat(processedEvent.amount || 0);
          
          // Check if this is a remaining balance payment
          // If order already has partial payment and payment_status is 'partial', this is remaining balance
          const isRemainingBalancePayment = order.payment_status === 'partial' && existingPaymentAmount > 0;
          
          // Check if this is a 50% partial payment (initial payment)
          // If payment_amount exists and is approximately 50% of total (within 1% tolerance)
          // or invoice amount is approximately 50% of total
          const isPartialPayment = !isRemainingBalancePayment && 
                                   ((existingPaymentAmount > 0 && existingPaymentAmount < totalAmount && 
                                    Math.abs(existingPaymentAmount - totalAmount * 0.5) < totalAmount * 0.01) || 
                                   (invoiceAmount > 0 && Math.abs(invoiceAmount - totalAmount * 0.5) < totalAmount * 0.01));
          
          const newPaymentStatus = isRemainingBalancePayment ? 'paid' : (isPartialPayment ? 'partial' : 'paid');
          
          // Calculate payment amounts
          let finalPaymentAmount;
          let finalRemainingBalance;
          let remainingAmount = 0; // For notification purposes
          
          if (isRemainingBalancePayment) {
            // This is a remaining balance payment
            remainingAmount = invoiceAmount; // The amount just paid
            finalPaymentAmount = existingPaymentAmount + remainingAmount; // Total paid now
            finalRemainingBalance = 0; // No remaining balance
          } else if (isPartialPayment && existingPaymentAmount === 0) {
            // Initial 50% payment
            finalPaymentAmount = totalAmount * 0.5;
            finalRemainingBalance = totalAmount * 0.5;
          } else if (!isPartialPayment) {
            // Full payment (no previous payment)
            finalPaymentAmount = totalAmount;
            finalRemainingBalance = 0;
          } else {
            // Keep existing partial payment
            finalPaymentAmount = existingPaymentAmount;
            finalRemainingBalance = totalAmount - existingPaymentAmount;
          }
          
          // Get vendor_id and customer_id for notifications
          const [orderInfo] = await pool.execute(
            `SELECT vendor_id, customer_id FROM orders WHERE order_id = ?`,
            [orderId]
          );

          // Update order: set payment_status, payment_amount, remaining_balance, and status
          await pool.execute(
            `UPDATE orders 
             SET payment_status = ?, 
                 payment_amount = ?,
                 remaining_balance = ?,
                 status = CASE 
                   WHEN status = 'pending' THEN 'confirmed'
                   ELSE status
                 END,
                 payment_method = 'gcash_integrated',
                 payment_intent_id = ?,
                 updated_at = NOW() 
             WHERE order_id = ?`,
            [newPaymentStatus, finalPaymentAmount, finalRemainingBalance, processedEvent.invoice_id, orderId]
          );

          console.log(`✅ Payment succeeded for order ${orderId} - Payment status: ${newPaymentStatus}, Order status updated to confirmed`);

          // Create notifications for vendor and customer
          if (orderInfo.length > 0) {
            const { vendor_id, customer_id } = orderInfo[0];
            
            // Get vendor's user_id
            const [vendorUser] = await pool.execute(
              `SELECT user_id FROM vendors WHERE vendor_id = ?`,
              [vendor_id]
            );

            if (vendorUser.length > 0) {
              const vendorUserId = vendorUser[0].user_id;
              
              if (isRemainingBalancePayment) {
                // Remaining balance payment notification
                const remainingVendorEarnings = remainingAmount * 0.97;
                
                await createNotification({
                  user_id: vendorUserId,
                  user_type: 'vendor',
                  title: 'Remaining Balance Payment Received',
                  message: `You received ₱${remainingVendorEarnings.toFixed(2)} (97% of ₱${remainingAmount.toFixed(2)}) for order #${orderId}. Remaining balance completed. Money sent to your GCash.`,
                  notification_type: 'payment_confirmed',
                  related_order_id: parseInt(orderId),
                  related_vendor_id: vendor_id,
                  related_customer_id: customer_id
                });

                await createNotification({
                  user_id: customer_id,
                  user_type: 'customer',
                  title: 'Remaining Balance Payment Confirmed',
                  message: `Your remaining balance payment of ₱${remainingAmount.toFixed(2)} for order #${orderId} has been confirmed. Full payment completed.`,
                  notification_type: 'payment_confirmed',
                  related_order_id: parseInt(orderId),
                  related_vendor_id: vendor_id,
                  related_customer_id: customer_id
                });
              } else {
                // Calculate vendor earnings (97% of payment amount)
                const vendorEarnings = finalPaymentAmount * 0.97;
                const platformFee = finalPaymentAmount * 0.03;
                
                if (isPartialPayment) {
                  // Partial payment notification for vendor
                  await createNotification({
                    user_id: vendorUserId,
                    user_type: 'vendor',
                    title: 'Partial Payment Received',
                    message: `You received ₱${vendorEarnings.toFixed(2)} (97% of ₱${finalPaymentAmount.toFixed(2)}) for order #${orderId}. Remaining balance: ₱${finalRemainingBalance.toFixed(2)}. Money sent to your GCash.`,
                    notification_type: 'payment_confirmed',
                    related_order_id: parseInt(orderId),
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                  });

                  // Partial payment notification for customer
                  await createNotification({
                    user_id: customer_id,
                    user_type: 'customer',
                    title: 'Partial Payment Confirmed',
                    message: `Your partial payment of ₱${finalPaymentAmount.toFixed(2)} for order #${orderId} has been confirmed. Remaining balance of ₱${finalRemainingBalance.toFixed(2)} is due on delivery.`,
                    notification_type: 'payment_confirmed',
                    related_order_id: parseInt(orderId),
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                  });
                } else {
                  // Full payment notification for vendor
                  await createNotification({
                    user_id: vendorUserId,
                    user_type: 'vendor',
                    title: 'Payment Received',
                    message: `You received ₱${vendorEarnings.toFixed(2)} (97% of ₱${finalPaymentAmount.toFixed(2)}) for order #${orderId}. Money sent to your GCash.`,
                    notification_type: 'payment_confirmed',
                    related_order_id: parseInt(orderId),
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                  });

                  // Full payment notification for customer
                  await createNotification({
                    user_id: customer_id,
                    user_type: 'customer',
                    title: 'Payment Confirmed',
                    message: `Your payment of ₱${finalPaymentAmount.toFixed(2)} for order #${orderId} has been confirmed. The vendor will now start preparing your order.`,
                    notification_type: 'payment_confirmed',
                    related_order_id: parseInt(orderId),
                    related_vendor_id: vendor_id,
                    related_customer_id: customer_id
                  });
                }
              }
            }
          }
        } else {
          // Fallback: if order not found, just update payment status
          await pool.execute(
            `UPDATE orders 
             SET payment_status = 'paid', 
                 status = CASE 
                   WHEN status = 'pending' THEN 'confirmed'
                   ELSE status
                 END,
                 payment_method = 'gcash',
                 payment_intent_id = ?,
                 updated_at = NOW() 
             WHERE order_id = ?`,
            [processedEvent.invoice_id, orderId]
          );
          
          console.log(`✅ Payment succeeded for order ${orderId} (order details not found, using fallback)`);
        }
      } else if (processedEvent.status === 'EXPIRED') {
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'failed', 
               updated_at = NOW() 
           WHERE order_id = ?`,
          [processedEvent.metadata?.order_id]
        );

        console.log(`⏰ Payment expired for order ${processedEvent.metadata?.order_id}`);
      }

    } catch (dbError) {
      console.error('Database error updating payment status:', dbError);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      status: processedEvent.status
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get payment history for a customer
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const offset = (page - 1) * limit;

    // Get payment history
    const [payments] = await pool.execute(
      `SELECT 
         pi.payment_intent_id,
         pi.order_id,
         pi.amount,
         pi.currency,
         pi.status,
         pi.payment_method,
         pi.metadata,
         pi.created_at,
         o.status as order_status,
         o.delivery_datetime
       FROM payment_intents pi
       LEFT JOIN orders o ON pi.order_id = o.order_id
       WHERE pi.customer_id = ?
       ORDER BY pi.created_at DESC
       LIMIT ? OFFSET ?`,
      [customer_id, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM payment_intents WHERE customer_id = ?`,
      [customer_id]
    );

    res.json({
      success: true,
      payments: payments.map(payment => ({
        payment_intent_id: payment.payment_intent_id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
        metadata: JSON.parse(payment.metadata || '{}'),
        created_at: payment.created_at,
        order_status: payment.order_status,
        delivery_datetime: payment.delivery_datetime
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        total_pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create integrated GCash payment with automatic split payment
 * Automatically fetches vendor GCash number and creates split payment invoice
 */
const createIntegratedGCashPayment = async (req, res) => {
  try {
    const {
      order_id,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      items = [],
      commission_rate = 3.0 // Default 3% platform commission
    } = req.body;

    console.log('💳 Creating integrated GCash payment for order:', order_id);

    // Validate required fields
    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Get order details including vendor_id and payment fields
    const [orders] = await pool.query(
      `SELECT o.*, v.store_name, v.vendor_id, 
              o.payment_amount, o.payment_status, o.initial_payment_method, o.remaining_payment_method
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.vendor_id
       WHERE o.order_id = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];
    const vendor_id = order.vendor_id;
    const orderTotalAmount = parseFloat(order.total_amount || 0);
    const orderPaymentAmount = parseFloat(order.payment_amount || 0);
    const orderPaymentStatus = order.payment_status || 'unpaid';

    console.log('📦 Order found for vendor:', vendor_id, order.store_name);
    console.log('💰 Order payment details:', {
      total_amount: orderTotalAmount,
      payment_amount: orderPaymentAmount,
      payment_status: orderPaymentStatus,
      requested_amount: amount,
      initial_payment_method: order.initial_payment_method
    });

    // Validate payment amount - ALWAYS use order's payment_amount if it's set for 50% payments
    let finalPaymentAmount = parseFloat(amount);
    
    // Check if order was created with 50% payment option
    const is50PercentOrder = order.initial_payment_method === 'GCash' || 
                             (orderPaymentAmount > 0 && Math.abs(orderPaymentAmount - orderTotalAmount * 0.5) < orderTotalAmount * 0.01);
    
    if (orderPaymentStatus === 'unpaid' && is50PercentOrder) {
      // Order expects 50% payment - ALWAYS use order's payment_amount, ignore frontend amount
      if (orderPaymentAmount > 0) {
        finalPaymentAmount = orderPaymentAmount;
        console.log('✅ FORCING 50% payment - Using order payment_amount:', finalPaymentAmount, 'instead of requested:', amount);
      } else {
        // Calculate 50% if payment_amount not set
        finalPaymentAmount = orderTotalAmount * 0.5;
        console.log('✅ FORCING 50% payment - Calculating:', finalPaymentAmount, 'instead of requested:', amount);
      }
    } else if (orderPaymentStatus === 'unpaid' && orderPaymentAmount > 0) {
      // Order has payment_amount set but might not be 50% - use it if it matches request
      if (Math.abs(parseFloat(amount) - orderPaymentAmount) < 1) {
        finalPaymentAmount = orderPaymentAmount;
        console.log('✅ Using order payment_amount (matches request):', finalPaymentAmount);
      } else {
        console.warn('⚠️ Payment amount mismatch:', {
          requested: amount,
          order_payment_amount: orderPaymentAmount,
          using: finalPaymentAmount
        });
      }
    }
    
    // Final validation: Ensure we're not charging more than total
    if (finalPaymentAmount > orderTotalAmount) {
      console.warn('⚠️ Payment amount exceeds total, capping at total:', orderTotalAmount);
      finalPaymentAmount = orderTotalAmount;
    }

    // Fetch vendor's GCash number automatically
    const [vendorGCash] = await pool.query(
      `SELECT gcash_number, business_name, is_active
       FROM vendor_gcash_qr
       WHERE vendor_id = ? AND is_active = 1`,
      [vendor_id]
    );

    if (vendorGCash.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vendor has not set up GCash payment. Please contact the vendor.',
        vendor_setup_required: true
      });
    }

    const vendorGCashInfo = vendorGCash[0];
    console.log('💰 Vendor GCash found:', vendorGCashInfo.gcash_number);

    // Create split payment invoice with Xendit
    const invoiceData = {
      amount: finalPaymentAmount,
      order_id,
      customer_id: order.customer_id,
      vendor_id: vendor_id,
      vendor_gcash_number: vendorGCashInfo.gcash_number,
      vendor_name: vendorGCashInfo.business_name || order.store_name,
      commission_rate: parseFloat(commission_rate),
      customer_name: customer_name || 'Customer',
      customer_email: customer_email || 'customer@example.com',
      customer_phone: customer_phone || '+639123456789',
      items: items.map(item => ({
        name: item.name || item.flavor_name || 'Ice Cream',
        quantity: item.quantity || 1,
        price: item.price || 0,
        category: 'Food & Beverage'
      })),
      items_count: items.length.toString(),
      items_summary: items.map(item =>
        `${item.name || item.flavor_name || 'Item'} x${item.quantity || 1}`
      ).join(', ')
    };

    console.log('🔄 Creating Xendit split payment invoice...');
    const invoice = await xenditService.createSplitPaymentInvoice(invoiceData);

    // Store invoice in database
    try {
      await pool.execute(
        `INSERT INTO payment_intents (
          payment_intent_id,
          order_id,
          customer_id,
          vendor_id,
          amount,
          currency,
          status,
          payment_method,
          metadata,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          invoice.id,
          order_id,
          order.customer_id,
          vendor_id,
          parseFloat(amount),
          'PHP',
          invoice.status,
          'gcash_integrated',
          JSON.stringify({
            external_id: invoice.external_id,
            invoice_url: invoice.invoice_url,
            mobile_url: invoice.mobile_url || invoice.invoice_url,
            vendor_gcash: vendorGCashInfo.gcash_number,
            commission_rate: commission_rate,
            platform_commission: (parseFloat(amount) * parseFloat(commission_rate)) / 100,
            vendor_amount: parseFloat(amount) - (parseFloat(amount) * parseFloat(commission_rate)) / 100,
            items_summary: items.map(item =>
              `${item.name || item.flavor_name || 'Item'} x${item.quantity || 1}`
            ).join(', ')
          })
        ]
      );
    } catch (dbError) {
      console.error('Database error storing invoice:', dbError);
      // Continue even if database storage fails
    }

    console.log('✅ Integrated payment created successfully');

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        external_id: invoice.external_id,
        amount: invoice.amount,
        currency: invoice.currency || 'PHP',
        status: invoice.status,
        invoice_url: invoice.invoice_url,
        mobile_url: invoice.mobile_url || invoice.invoice_url,
        expiry_date: invoice.expiry_date,
        qr_code_url: invoice.qr_code_url || null,
        payment_details: {
          total_amount: parseFloat(amount),
          platform_commission: (parseFloat(amount) * parseFloat(commission_rate)) / 100,
          vendor_amount: parseFloat(amount) - (parseFloat(amount) * parseFloat(commission_rate)) / 100,
          commission_rate: parseFloat(commission_rate)
        }
      },
      vendor: {
        name: vendorGCashInfo.business_name || order.store_name,
        gcash_masked: vendorGCashInfo.gcash_number.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
      }
    });

  } catch (error) {
    console.error('❌ Create integrated payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Test Xendit integration
 */
const testXenditIntegration = async (req, res) => {
  try {
    console.log('🧪 Starting Xendit integration test...');
    
    const testResults = await xenditService.testIntegration();

    // Test Database Connection
    try {
      const [rows] = await pool.query('SELECT 1 as test');
      testResults.tests.push({
        name: 'Database Connection',
        status: 'pass',
        details: {
          connection: 'Success',
          testQuery: rows[0].test
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Database Connection',
        status: 'fail',
        error: error.message
      });
    }

    // Test Payment Tables
    try {
      const [tables] = await pool.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('payment_intents', 'orders')
      `);
      
      const existingTables = tables.map(t => t.TABLE_NAME);
      testResults.tests.push({
        name: 'Payment Tables',
        status: 'pass',
        details: {
          existingTables,
          paymentIntentsTable: existingTables.includes('payment_intents'),
          ordersTable: existingTables.includes('orders')
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Payment Tables',
        status: 'fail',
        error: error.message
      });
    }

    // Calculate overall status
    const failedTests = testResults.tests.filter(test => test.status === 'fail');
    const overallStatus = failedTests.length === 0 ? 'PASS' : 'FAIL';

    console.log(`🧪 Xendit integration test completed: ${overallStatus}`);
    console.log(`✅ Passed: ${testResults.tests.filter(t => t.status === 'pass').length}`);
    console.log(`❌ Failed: ${failedTests.length}`);

    res.json({
      success: true,
      status: overallStatus,
      summary: {
        total: testResults.tests.length,
        passed: testResults.tests.filter(t => t.status === 'pass').length,
        failed: failedTests.length
      },
      results: testResults
    });

  } catch (error) {
    console.error('❌ Xendit integration test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test execution failed',
      details: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  createIntegratedGCashPayment,
  getPaymentIntentStatus,
  handleWebhook,
  getPaymentHistory,
  testXenditIntegration
};
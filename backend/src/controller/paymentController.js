const xenditService = require('../services/xenditService');
const pool = require('../db/config');

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
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'paid', 
               payment_method = 'gcash',
               payment_intent_id = ?,
               updated_at = NOW() 
           WHERE order_id = ?`,
          [processedEvent.invoice_id, processedEvent.metadata?.order_id]
        );

        console.log(`✅ Payment succeeded for order ${processedEvent.metadata?.order_id}`);
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
  getPaymentIntentStatus,
  handleWebhook,
  getPaymentHistory,
  testXenditIntegration
};
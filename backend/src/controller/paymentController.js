const paymongoService = require('../services/paymongoService');
const pool = require('../db/config');

/**
 * Create a payment intent for GCash payment
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
      items = []
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

    // Create payment intent with PayMongo
    const paymentIntent = await paymongoService.createPaymentIntent({
      amount: parseFloat(amount),
      currency,
      description: description || `Order #${order_id} - Ice Cream Delivery`,
      metadata: {
        order_id,
        customer_id: customer_id || null,
        vendor_id: vendor_id || null,
        delivery_fee: parseFloat(delivery_fee),
        items_count: items.length,
        items_summary: items.map(item => `${item.name || item.flavor_name || 'Item'} x${item.quantity || 1}`).join(', '),
        payment_method: 'gcash',
        platform: 'ice_cream_delivery_app'
      }
    });

    if (!paymentIntent.success) {
      return res.status(400).json({
        success: false,
        error: paymentIntent.error || 'Failed to create payment intent'
      });
    }

    // Store payment intent in database
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
          paymentIntent.payment_intent.id,
          order_id,
          customer_id || null,
          vendor_id || null,
          parseFloat(amount),
          currency,
          paymentIntent.payment_intent.attributes.status,
          'gcash',
          JSON.stringify(paymentIntent.payment_intent.attributes.metadata),
        ]
      );
    } catch (dbError) {
      console.error('Database error storing payment intent:', dbError);
      // Continue even if database storage fails
    }

    res.json({
      success: true,
      payment_intent: {
        id: paymentIntent.payment_intent.id,
        client_key: paymentIntent.client_key,
        amount: paymentIntent.payment_intent.attributes.amount / 100,
        currency: paymentIntent.payment_intent.attributes.currency,
        status: paymentIntent.payment_intent.attributes.status,
        next_action: paymentIntent.payment_intent.attributes.next_action
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get payment intent status
 */
const getPaymentIntentStatus = async (req, res) => {
  try {
    const { payment_intent_id } = req.params;

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    // Get payment intent from PayMongo
    const paymentIntent = await paymongoService.getPaymentIntent(payment_intent_id);

    if (!paymentIntent.success) {
      return res.status(404).json({
        success: false,
        error: paymentIntent.error || 'Payment intent not found'
      });
    }

    res.json({
      success: true,
      payment_intent: {
        id: paymentIntent.payment_intent.id,
        amount: paymentIntent.payment_intent.attributes.amount / 100,
        currency: paymentIntent.payment_intent.attributes.currency,
        status: paymentIntent.payment_intent.attributes.status,
        metadata: paymentIntent.payment_intent.attributes.metadata,
        created_at: paymentIntent.payment_intent.attributes.created_at,
        updated_at: paymentIntent.payment_intent.attributes.updated_at
      }
    });

  } catch (error) {
    console.error('Get payment intent status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Handle PayMongo webhook events
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['paymongo-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!paymongoService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const eventData = req.body;
    const processedEvent = paymongoService.processWebhookEvent(eventData);

    if (!processedEvent.success) {
      console.error('Failed to process webhook event:', processedEvent.error);
      return res.status(400).json({
        success: false,
        error: processedEvent.error
      });
    }

    // Update payment intent status in database
    try {
      await pool.execute(
        `UPDATE payment_intents 
         SET status = ?, updated_at = NOW() 
         WHERE payment_intent_id = ?`,
        [processedEvent.status, processedEvent.payment_intent_id]
      );

      // If payment succeeded, update order status
      if (processedEvent.event_type === 'payment_succeeded') {
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'paid', 
               payment_method = 'gcash',
               payment_intent_id = ?,
               updated_at = NOW() 
           WHERE order_id = ?`,
          [processedEvent.payment_intent_id, processedEvent.metadata?.order_id]
        );

        console.log(`✅ Payment succeeded for order ${processedEvent.metadata?.order_id}`);
      } else if (processedEvent.event_type === 'payment_failed') {
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'failed', 
               updated_at = NOW() 
           WHERE order_id = ?`,
          [processedEvent.metadata?.order_id]
        );

        console.log(`❌ Payment failed for order ${processedEvent.metadata?.order_id}`);
      }

    } catch (dbError) {
      console.error('Database error updating payment status:', dbError);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      event_type: processedEvent.event_type
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
         o.order_status,
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
 * Test PayMongo integration
 */
const testPayMongoIntegration = async (req, res) => {
  try {
    console.log('🧪 Starting PayMongo integration test...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Environment Variables
    console.log('Test 1: Checking environment variables...');
    const envTest = {
      name: 'Environment Variables',
      status: 'pass',
      details: {
        PAYMONGO_PUBLIC_KEY: process.env.PAYMONGO_PUBLIC_KEY ? 'Set' : 'Missing',
        PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY ? 'Set' : 'Missing',
        PAYMONGO_API_URL: process.env.PAYMONGO_API_URL || 'Using default',
        PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET ? 'Set' : 'Missing'
      }
    };
    
    if (!process.env.PAYMONGO_PUBLIC_KEY || !process.env.PAYMONGO_SECRET_KEY) {
      envTest.status = 'fail';
      envTest.error = 'Missing required PayMongo API keys';
    }
    
    testResults.tests.push(envTest);

    // Test 2: PayMongo Service Initialization
    console.log('Test 2: Testing PayMongo service initialization...');
    const serviceTest = {
      name: 'PayMongo Service',
      status: 'pass',
      details: {}
    };

    try {
      const paymongoService = require('../services/paymongoService');
      serviceTest.details.service = 'Initialized successfully';
      serviceTest.details.baseURL = paymongoService.baseURL;
      serviceTest.details.publicKey = paymongoService.publicKey ? `${paymongoService.publicKey.substring(0, 10)}...` : 'Not set';
    } catch (error) {
      serviceTest.status = 'fail';
      serviceTest.error = error.message;
    }

    testResults.tests.push(serviceTest);

    // Test 3: Create Test Payment Intent
    console.log('Test 3: Creating test payment intent...');
    const paymentIntentTest = {
      name: 'Payment Intent Creation',
      status: 'pass',
      details: {}
    };

    try {
      const testPaymentData = {
        amount: 1.00, // ₱1.00 test amount
        currency: 'PHP',
        description: 'PayMongo Integration Test',
        metadata: {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      };

      const result = await paymongoService.createPaymentIntent(testPaymentData);
      
      if (result.success) {
        paymentIntentTest.details.paymentIntentId = result.payment_intent.id;
        paymentIntentTest.details.clientKey = result.payment_intent.client_key;
        paymentIntentTest.details.status = result.payment_intent.status;
        paymentIntentTest.details.amount = result.payment_intent.amount;
      } else {
        paymentIntentTest.status = 'fail';
        paymentIntentTest.error = result.error;
      }
    } catch (error) {
      paymentIntentTest.status = 'fail';
      paymentIntentTest.error = error.message;
    }

    testResults.tests.push(paymentIntentTest);

    // Test 4: Database Connection
    console.log('Test 4: Testing database connection...');
    const dbTest = {
      name: 'Database Connection',
      status: 'pass',
      details: {}
    };

    try {
      const [rows] = await pool.query('SELECT 1 as test');
      dbTest.details.connection = 'Success';
      dbTest.details.testQuery = rows[0].test;
    } catch (error) {
      dbTest.status = 'fail';
      dbTest.error = error.message;
    }

    testResults.tests.push(dbTest);

    // Test 5: Payment Tables
    console.log('Test 5: Checking payment tables...');
    const tablesTest = {
      name: 'Payment Tables',
      status: 'pass',
      details: {}
    };

    try {
      // Check if payment_intents table exists
      const [tables] = await pool.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('payment_intents', 'orders')
      `);
      
      tablesTest.details.existingTables = tables.map(t => t.TABLE_NAME);
      tablesTest.details.paymentIntentsTable = tables.some(t => t.TABLE_NAME === 'payment_intents');
      tablesTest.details.ordersTable = tables.some(t => t.TABLE_NAME === 'orders');
      
      if (!tablesTest.details.paymentIntentsTable || !tablesTest.details.ordersTable) {
        tablesTest.status = 'fail';
        tablesTest.error = 'Required tables missing';
      }
    } catch (error) {
      tablesTest.status = 'fail';
      tablesTest.error = error.message;
    }

    testResults.tests.push(tablesTest);

    // Calculate overall status
    const failedTests = testResults.tests.filter(test => test.status === 'fail');
    const overallStatus = failedTests.length === 0 ? 'PASS' : 'FAIL';

    console.log(`🧪 PayMongo integration test completed: ${overallStatus}`);
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
    console.error('❌ PayMongo integration test failed:', error);
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
  testPayMongoIntegration
};

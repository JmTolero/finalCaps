const axios = require('axios');
const crypto = require('crypto');

class XenditService {
  constructor() {
    // Xendit API configuration
    this.baseURL = process.env.XENDIT_API_URL || 'https://api.xendit.co';
    this.publicKey = process.env.XENDIT_PUBLIC_KEY;
    this.secretKey = process.env.XENDIT_SECRET_KEY;
    this.webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;
    
    // Validate required environment variables
    if (!this.publicKey || !this.secretKey) {
      console.warn('⚠️ Xendit API keys not found. Please set XENDIT_PUBLIC_KEY and XENDIT_SECRET_KEY');
    } else {
      console.log('✅ Xendit service initialized successfully');
    }
  }

  /**
   * Create a split payment invoice for GCash payment
   * @param {Object} paymentData - Payment details with vendor info
   * @returns {Promise<Object>} Invoice response with split payment
   */
  async createSplitPaymentInvoice(paymentData) {
    try {
      console.log('🔄 Creating Xendit split payment invoice...', {
        amount: paymentData.amount,
        order_id: paymentData.order_id,
        customer_id: paymentData.customer_id,
        vendor_id: paymentData.vendor_id,
        commission_rate: paymentData.commission_rate
      });

      // Calculate split payment amounts
      const commissionRate = paymentData.commission_rate || 3.00; // Default 3%
      const platformCommission = (paymentData.amount * commissionRate) / 100;
      const vendorAmount = paymentData.amount - platformCommission;

      console.log('💰 Split payment calculation:', {
        total_amount: paymentData.amount,
        platform_commission: platformCommission,
        vendor_amount: vendorAmount,
        commission_rate: commissionRate + '%'
      });

      const invoiceData = {
        external_id: `icecream_order_${paymentData.order_id}_${Date.now()}`,
        amount: paymentData.amount,
        description: `Ice Cream Delivery - Order #${paymentData.order_id}`,
        invoice_duration: 3600, // 1 hour expiry
        customer: {
          given_names: paymentData.customer_name || 'Customer',
          email: paymentData.customer_email || 'customer@example.com',
          mobile_number: paymentData.customer_phone || '+639123456789'
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/payment/success/${paymentData.order_id}`,
        failure_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/payment/failed/${paymentData.order_id}`,
        payment_methods: ['GCASH'],
        currency: 'PHP',
        items: paymentData.items || [],
        fees: [
          {
            type: 'ADMIN',
            value: platformCommission
          }
        ],
        // Split payment configuration
        split_payment: {
          enabled: true,
          recipients: [
            {
              type: 'VENDOR',
              amount: vendorAmount,
              gcash_number: paymentData.vendor_gcash_number,
              description: `Payment to ${paymentData.vendor_name || 'Vendor'}`
            }
          ]
        },
        metadata: {
          order_id: paymentData.order_id ? paymentData.order_id.toString() : 'unknown',
          customer_id: paymentData.customer_id ? paymentData.customer_id.toString() : 'unknown',
          vendor_id: paymentData.vendor_id ? paymentData.vendor_id.toString() : 'unknown',
          vendor_amount: vendorAmount.toString(),
          platform_commission: platformCommission.toString(),
          commission_rate: commissionRate.toString(),
          items_count: paymentData.items_count || '0',
          items_summary: paymentData.items_summary || 'Ice cream order'
        }
      };

      const response = await axios.post(`${this.baseURL}/v2/invoices`, invoiceData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Xendit split payment invoice created successfully:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('❌ Xendit split payment invoice creation failed:', error.response?.data || error.message);
      throw new Error(`Xendit API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a subscription payment invoice for vendor upgrades
   * @param {Object} subscriptionData - Subscription payment details
   * @returns {Promise<Object>} Invoice response
   */
  async createSubscriptionInvoice(subscriptionData) {
    try {
      console.log('🔄 Creating Xendit subscription invoice...', {
        amount: subscriptionData.amount,
        vendor_id: subscriptionData.vendor_id,
        plan_name: subscriptionData.plan_name
      });

      const invoiceData = {
        external_id: `subscription_${subscriptionData.vendor_id}_${Date.now()}`,
        amount: subscriptionData.amount,
        description: `Subscription Upgrade - ${subscriptionData.plan_name}`,
        invoice_duration: 3600, // 1 hour expiry
        customer: {
          given_names: subscriptionData.vendor_name || 'Vendor',
          email: subscriptionData.vendor_email || 'vendor@example.com',
          mobile_number: subscriptionData.vendor_phone || '+639123456789'
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/subscription/success`,
        failure_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/subscription/failed`,
        payment_methods: ['GCASH'],
        currency: 'PHP',
        items: [
          {
            name: `${subscriptionData.plan_name} Plan`,
            quantity: 1,
            price: subscriptionData.amount,
            category: 'Subscription'
          }
        ],
        metadata: {
          vendor_id: subscriptionData.vendor_id ? subscriptionData.vendor_id.toString() : 'unknown',
          plan_name: subscriptionData.plan_name || 'unknown',
          subscription_type: 'upgrade',
          billing_cycle: subscriptionData.billing_cycle || 'monthly',
          features: subscriptionData.features || '[]'
        }
      };

      const response = await axios.post(`${this.baseURL}/v2/invoices`, invoiceData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Xendit subscription invoice created successfully:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('❌ Xendit subscription invoice creation failed:', error.response?.data || error.message);
      throw new Error(`Xendit API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a regular payment invoice for GCash payment (legacy method)
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Invoice response
   */
  async createInvoice(paymentData) {
    try {
      console.log('🔄 Creating Xendit invoice...', {
        amount: paymentData.amount,
        order_id: paymentData.order_id,
        customer_id: paymentData.customer_id
      });

      const invoiceData = {
        external_id: `icecream_order_${paymentData.order_id}_${Date.now()}`,
        amount: paymentData.amount,
        description: `Ice Cream Delivery - Order #${paymentData.order_id}`,
        invoice_duration: 3600, // 1 hour expiry
        customer: {
          given_names: paymentData.customer_name || 'Customer',
          email: paymentData.customer_email || 'customer@example.com',
          mobile_number: paymentData.customer_phone || '+639123456789'
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/payment/success/${paymentData.order_id}`,
        failure_redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/payment/failed/${paymentData.order_id}`,
        payment_methods: ['GCASH'],
        currency: 'PHP',
        items: paymentData.items || [],
        fees: [
          {
            type: 'ADMIN',
            value: 0
          }
        ],
        metadata: {
          order_id: paymentData.order_id ? paymentData.order_id.toString() : 'unknown',
          customer_id: paymentData.customer_id ? paymentData.customer_id.toString() : 'unknown',
          vendor_id: paymentData.vendor_id ? paymentData.vendor_id.toString() : 'unknown',
          items_count: paymentData.items_count || '0',
          items_summary: paymentData.items_summary || 'Ice cream order'
        }
      };

      const response = await axios.post(`${this.baseURL}/v2/invoices`, invoiceData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Xendit invoice created successfully:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('❌ Xendit invoice creation failed:', error.response?.data || error.message);
      throw new Error(`Xendit API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get invoice status
   * @param {string} invoiceId - Xendit invoice ID
   * @returns {Promise<Object>} Invoice status
   */
  async getInvoiceStatus(invoiceId) {
    try {
      console.log('🔄 Getting Xendit invoice status:', invoiceId);

      const response = await axios.get(`${this.baseURL}/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Invoice status retrieved:', response.data.status);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to get invoice status:', error.response?.data || error.message);
      throw new Error(`Xendit API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.webhookSecret) {
        console.warn('⚠️ Xendit webhook secret not configured');
        return true; // Allow in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');
      
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      console.log('🔐 Webhook signature verification:', isValid ? 'VALID' : 'INVALID');
      return isValid;

    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Handle webhook notification
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processed webhook data
   */
  handleWebhook(webhookData) {
    try {
      console.log('🔄 Processing Xendit webhook:', webhookData.id);

      const processedData = {
        webhook_id: webhookData.id,
        invoice_id: webhookData.data?.id,
        external_id: webhookData.data?.external_id,
        status: webhookData.data?.status,
        amount: webhookData.data?.amount,
        currency: webhookData.data?.currency,
        payment_method: webhookData.data?.payment_method,
        paid_at: webhookData.data?.paid_at,
        created: webhookData.created,
        metadata: webhookData.data?.metadata || {}
      };

      console.log('✅ Webhook processed successfully:', processedData.status);
      return processedData;

    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      throw new Error(`Webhook processing error: ${error.message}`);
    }
  }

  /**
   * Test Xendit integration
   * @returns {Promise<Object>} Test results
   */
  async testIntegration() {
    try {
      console.log('🧪 Testing Xendit integration...');

      const testResults = {
        timestamp: new Date().toISOString(),
        tests: []
      };

      // Test 1: Environment Variables
      const envTest = {
        name: 'Environment Variables',
        status: 'pass',
        details: {
          XENDIT_PUBLIC_KEY: this.publicKey ? 'Set' : 'Missing',
          XENDIT_SECRET_KEY: this.secretKey ? 'Set' : 'Missing',
          XENDIT_API_URL: this.baseURL,
          XENDIT_WEBHOOK_SECRET: this.webhookSecret ? 'Set' : 'Missing'
        }
      };

      if (!this.publicKey || !this.secretKey) {
        envTest.status = 'fail';
        envTest.error = 'Missing required API keys';
      }

      testResults.tests.push(envTest);

      // Test 2: API Connection
      try {
        const response = await axios.get(`${this.baseURL}/v2/invoices`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          params: { limit: 1 }
        });

        testResults.tests.push({
          name: 'API Connection',
          status: 'pass',
          details: {
            status_code: response.status,
            message: 'Successfully connected to Xendit API'
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'API Connection',
          status: 'fail',
          error: error.response?.data?.message || error.message
        });
      }

      // Test 3: Create Test Invoice
      try {
        const testInvoiceData = {
          amount: 100,
          order_id: 'test_' + Date.now(),
          customer_id: 1,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+639123456789',
          items_count: '1',
          items_summary: 'Test ice cream order'
        };

        const invoice = await this.createInvoice(testInvoiceData);
        
        testResults.tests.push({
          name: 'Create Test Invoice',
          status: 'pass',
          details: {
            invoice_id: invoice.id,
            external_id: invoice.external_id,
            amount: invoice.amount,
            status: invoice.status,
            invoice_url: invoice.invoice_url
          }
        });

        // Store test invoice ID for cleanup
        testResults.test_invoice_id = invoice.id;

      } catch (error) {
        testResults.tests.push({
          name: 'Create Test Invoice',
          status: 'fail',
          error: error.message
        });
      }

      // Calculate overall status
      const failedTests = testResults.tests.filter(test => test.status === 'fail');
      testResults.overall_status = failedTests.length === 0 ? 'pass' : 'fail';
      testResults.summary = `${testResults.tests.length - failedTests.length}/${testResults.tests.length} tests passed`;

      console.log('✅ Xendit integration test completed:', testResults.summary);
      return testResults;

    } catch (error) {
      console.error('❌ Xendit integration test failed:', error);
      return {
        overall_status: 'fail',
        error: 'Test execution failed',
        details: error.message
      };
    }
  }
}

module.exports = new XenditService();

const axios = require('axios');
const crypto = require('crypto');

class PayMongoService {
  constructor() {
    // PayMongo API configuration
    this.baseURL = process.env.PAYMONGO_API_URL || 'https://api.paymongo.com/v1';
    this.publicKey = process.env.PAYMONGO_PUBLIC_KEY;
    this.secretKey = process.env.PAYMONGO_SECRET_KEY;
    this.webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    
    // Validate required environment variables
    if (!this.publicKey || !this.secretKey) {
      console.warn('⚠️ PayMongo keys not configured. Please set PAYMONGO_PUBLIC_KEY and PAYMONGO_SECRET_KEY environment variables.');
    }
    
    console.log('PayMongo Service initialized:', {
      baseURL: this.baseURL,
      publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'NOT SET',
      secretKey: this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'NOT SET'
    });
  }

  /**
   * Create a payment intent for GCash payment
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount in centavos (PHP * 100)
   * @param {string} paymentData.currency - Currency code (PHP)
   * @param {string} paymentData.description - Payment description
   * @param {Object} paymentData.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent response
   */
  async createPaymentIntent(paymentData) {
    try {
      const { amount, currency = 'PHP', description, metadata = {} } = paymentData;

      const payload = {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            currency: currency,
            description: description,
            payment_method_allowed: ['gcash']
          }
        }
      };

      console.log('PayMongo Payment Intent Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${this.baseURL}/payment_intents`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        payment_intent: response.data.data,
        client_key: this.publicKey
      };

    } catch (error) {
      console.error('PayMongo Payment Intent Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Create a payment method for GCash
   * @param {Object} paymentMethodData - Payment method details
   * @returns {Promise<Object>} Payment method response
   */
  async createPaymentMethod(paymentMethodData) {
    try {
      const payload = {
        data: {
          attributes: {
            type: 'gcash',
            details: {
              email: paymentMethodData.email || '',
              phone: paymentMethodData.phone || ''
            }
          }
        }
      };

      const response = await axios.post(
        `${this.baseURL}/payment_methods`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        payment_method: response.data.data
      };

    } catch (error) {
      console.error('PayMongo Payment Method Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Attach payment method to payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Attachment response
   */
  async attachPaymentMethod(paymentIntentId, paymentMethodId) {
    try {
      const payload = {
        data: {
          attributes: {
            payment_method: paymentMethodId
          }
        }
      };

      const response = await axios.post(
        `${this.baseURL}/payment_intents/${paymentIntentId}/attach`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        payment_intent: response.data.data
      };

    } catch (error) {
      console.error('PayMongo Attach Payment Method Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Retrieve payment intent details
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment_intents/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        payment_intent: response.data.data
      };

    } catch (error) {
      console.error('PayMongo Get Payment Intent Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Signature validity
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.webhookSecret) {
        console.warn('⚠️ PayMongo webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      const receivedSignature = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );

    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   * @param {Object} eventData - Webhook event data
   * @returns {Object} Processed event
   */
  processWebhookEvent(eventData) {
    try {
      const { type, data } = eventData;

      switch (type) {
        case 'payment_intent.succeeded':
          return {
            success: true,
            event_type: 'payment_succeeded',
            payment_intent_id: data.id,
            amount: data.attributes.amount / 100, // Convert from centavos
            status: data.attributes.status,
            metadata: data.attributes.metadata
          };

        case 'payment_intent.payment_failed':
          return {
            success: true,
            event_type: 'payment_failed',
            payment_intent_id: data.id,
            amount: data.attributes.amount / 100,
            status: data.attributes.status,
            metadata: data.attributes.metadata
          };

        case 'payment_intent.cancelled':
          return {
            success: true,
            event_type: 'payment_cancelled',
            payment_intent_id: data.id,
            amount: data.attributes.amount / 100,
            status: data.attributes.status,
            metadata: data.attributes.metadata
          };

        default:
          return {
            success: true,
            event_type: 'unknown',
            payment_intent_id: data.id,
            data: data
          };
      }

    } catch (error) {
      console.error('Webhook event processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayMongoService();

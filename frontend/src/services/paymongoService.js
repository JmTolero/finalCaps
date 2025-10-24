import axios from 'axios';

class PayMongoService {
  constructor() {
    this.apiBase = process.env.REACT_APP_API_URL || "https://finalcaps-3.onrender.com";
  }

  /**
   * Create a payment intent for GCash payment
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment intent response
   */
  async createPaymentIntent(paymentData) {
    try {
      const response = await axios.post(`${this.apiBase}/api/payments/create-payment-intent`, paymentData);
      
      if (response.data.success) {
        return {
          success: true,
          payment_intent: response.data.payment_intent
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to create payment intent'
        };
      }
    } catch (error) {
      console.error('PayMongo create payment intent error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error'
      };
    }
  }

  /**
   * Get payment intent status
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent status
   */
  async getPaymentIntentStatus(paymentIntentId) {
    try {
      const response = await axios.get(`${this.apiBase}/api/payments/intent/${paymentIntentId}`);
      
      if (response.data.success) {
        return {
          success: true,
          payment_intent: response.data.payment_intent
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to get payment intent status'
        };
      }
    } catch (error) {
      console.error('PayMongo get payment intent status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error'
      };
    }
  }

  /**
   * Initialize PayMongo payment form
   * @param {string} clientKey - PayMongo client key
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment form initialization result
   */
  async initializePaymentForm(clientKey, paymentIntentId) {
    try {
      // Load PayMongo script if not already loaded
      if (!window.PayMongo) {
        await this.loadPayMongoScript();
      }

      // Initialize PayMongo with client key
      console.log('PayMongo object:', window.PayMongo);
      console.log('Client key:', clientKey);
      const paymongo = new window.PayMongo(clientKey);
      console.log('PayMongo instance:', paymongo);
      console.log('PayMongo instance methods:', Object.keys(paymongo));

      // Create payment form using elements method
      let paymentForm;
      if (typeof paymongo.elements === 'function') {
        // For testing purposes, create a simple mock payment form
        // In production, you would use the actual PayMongo elements API
        console.log('Creating mock payment form for testing');
        
        paymentForm = {
          mount: (selector) => {
            console.log('Mock payment form mounted to:', selector);
            // In a real implementation, you would mount the actual PayMongo element here
          },
          onSuccess: (callback) => {
            console.log('Mock payment form success callback registered');
            // Store the callback for later use
            paymentForm._successCallback = callback;
          },
          onError: (callback) => {
            console.log('Mock payment form error callback registered');
            // Store the callback for later use
            paymentForm._errorCallback = callback;
          },
          processPayment: async () => {
            console.log('Mock payment processing...');
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate successful payment
            const mockResult = {
              status: 'succeeded',
              payment_intent: {
                id: paymentIntentId,
                status: 'succeeded'
              }
            };
            
            if (paymentForm._successCallback) {
              paymentForm._successCallback(mockResult);
            }
            
            return mockResult;
          }
        };
      } else {
        console.log('Available PayMongo methods:', Object.keys(paymongo));
        throw new Error('PayMongo SDK elements method not found. Available methods: ' + Object.keys(paymongo).join(', '));
      }

      return {
        success: true,
        paymentForm: paymentForm
      };

    } catch (error) {
      console.error('PayMongo payment form initialization error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initialize payment form'
      };
    }
  }

  /**
   * Load PayMongo JavaScript SDK
   * @returns {Promise<void>}
   */
  loadPayMongoScript() {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.PayMongo) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="paymongo"]')) {
        // Wait for script to load
        const checkPayMongo = () => {
          if (window.PayMongo) {
            resolve();
          } else {
            setTimeout(checkPayMongo, 100);
          }
        };
        checkPayMongo();
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://js.paymongo.com/v1';
      script.async = true;
      
      script.onload = () => {
        console.log('PayMongo script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load PayMongo script');
        reject(new Error('Failed to load PayMongo script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Get payment history for a customer
   * @param {string} customerId - Customer ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(customerId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const response = await axios.get(
        `${this.apiBase}/api/payments/history/${customerId}?page=${page}&limit=${limit}`
      );
      
      if (response.data.success) {
        return {
          success: true,
          payments: response.data.payments,
          pagination: response.data.pagination
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to get payment history'
        };
      }
    } catch (error) {
      console.error('PayMongo get payment history error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error'
      };
    }
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in PHP
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get payment status display text
   * @param {string} status - Payment status
   * @returns {string} Display text
   */
  getPaymentStatusText(status) {
    const statusMap = {
      'awaiting_payment_method': 'Awaiting Payment Method',
      'awaiting_next_action': 'Awaiting Next Action',
      'processing': 'Processing',
      'succeeded': 'Payment Successful',
      'failed': 'Payment Failed',
      'cancelled': 'Payment Cancelled'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Get payment status color class
   * @param {string} status - Payment status
   * @returns {string} CSS color class
   */
  getPaymentStatusColor(status) {
    const colorMap = {
      'awaiting_payment_method': 'text-yellow-600 bg-yellow-100',
      'awaiting_next_action': 'text-blue-600 bg-blue-100',
      'processing': 'text-blue-600 bg-blue-100',
      'succeeded': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'cancelled': 'text-gray-600 bg-gray-100'
    };
    
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }
}

export default new PayMongoService();

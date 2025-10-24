import axios from 'axios';

class XenditService {
  constructor() {
    this.apiBase = process.env.REACT_APP_API_URL || "https://finalcaps-3.onrender.com";
    this.publicKey = process.env.REACT_APP_XENDIT_PUBLIC_KEY;
    
    console.log('🔄 Initializing Xendit service...', {
      apiBase: this.apiBase,
      publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'Not set'
    });
  }

  /**
   * Create a payment invoice
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Invoice response
   */
  async createInvoice(paymentData) {
    try {
      console.log('🔄 Creating Xendit invoice...', paymentData);

      const response = await axios.post(`${this.apiBase}/api/payments/create-payment-intent`, paymentData);
      
      console.log('✅ Invoice created successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Invoice creation failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create invoice');
    }
  }

  /**
   * Get invoice status
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice status
   */
  async getInvoiceStatus(invoiceId) {
    try {
      console.log('🔄 Getting invoice status:', invoiceId);

      const response = await axios.get(`${this.apiBase}/api/payments/status/${invoiceId}`);
      
      console.log('✅ Invoice status retrieved:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to get invoice status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to get invoice status');
    }
  }

  /**
   * Initialize payment process
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(paymentData) {
    try {
      console.log('🔄 Initializing Xendit payment...', paymentData);

      const invoice = await this.createInvoice(paymentData);
      
      if (!invoice.success) {
        throw new Error(invoice.error || 'Failed to create invoice');
      }

      console.log('✅ Payment initialized successfully:', invoice.invoice.id);
      return {
        success: true,
        invoice: invoice.invoice,
        redirectUrl: invoice.invoice.invoice_url
      };

    } catch (error) {
      console.error('❌ Payment initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Process payment by redirecting to Xendit
   * @param {Object} invoice - Invoice data
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(invoice) {
    try {
      console.log('🔄 Processing payment via Xendit...', invoice.id);

      // For Xendit, we redirect the user to the invoice URL
      // The actual payment happens on Xendit's platform
      if (invoice.invoice_url) {
        console.log('🔄 Redirecting to Xendit payment page...');
        
        // Open payment page in new window/tab
        const paymentWindow = window.open(
          invoice.invoice_url, 
          'xendit_payment', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Return a promise that resolves when payment is completed
        return new Promise((resolve, reject) => {
          // Check payment status periodically
          const checkStatus = async () => {
            try {
              const statusResponse = await this.getInvoiceStatus(invoice.id);
              
              if (statusResponse.invoice.status === 'PAID') {
                paymentWindow.close();
                resolve({
                  success: true,
                  status: 'succeeded',
                  invoice: statusResponse.invoice
                });
              } else if (statusResponse.invoice.status === 'EXPIRED') {
                paymentWindow.close();
                reject({
                  success: false,
                  status: 'expired',
                  error: 'Payment expired'
                });
              } else if (statusResponse.invoice.status === 'FAILED') {
                paymentWindow.close();
                reject({
                  success: false,
                  status: 'failed',
                  error: 'Payment failed'
                });
              } else {
                // Still processing, check again in 2 seconds
                setTimeout(checkStatus, 2000);
              }
            } catch (error) {
              console.error('Error checking payment status:', error);
              setTimeout(checkStatus, 2000);
            }
          };

          // Start checking status after 3 seconds
          setTimeout(checkStatus, 3000);

          // Handle window close
          const checkClosed = () => {
            if (paymentWindow.closed) {
              reject({
                success: false,
                status: 'cancelled',
                error: 'Payment cancelled by user'
              });
            } else {
              setTimeout(checkClosed, 1000);
            }
          };

          setTimeout(checkClosed, 1000);
        });
      } else {
        throw new Error('No payment URL available');
      }

    } catch (error) {
      console.error('❌ Payment processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Test Xendit integration
   * @returns {Promise<Object>} Test results
   */
  async testIntegration() {
    try {
      console.log('🧪 Testing Xendit integration...');

      const response = await axios.get(`${this.apiBase}/api/payments/test`);
      
      console.log('✅ Xendit integration test completed:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Xendit integration test failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Integration test failed');
    }
  }
}

export default new XenditService();

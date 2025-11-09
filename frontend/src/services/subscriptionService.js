import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class SubscriptionService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/subscription`;
  }

  /**
   * Create a subscription payment for vendor upgrade
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment response
   */
  async createSubscriptionPayment(paymentData) {
    try {
      console.log('🔄 Creating subscription payment...', paymentData);

      const user = JSON.parse(sessionStorage.getItem('user'));
      console.log('👤 User from session:', user);
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      console.log('🌐 Making request to:', `${this.baseURL}/create-payment`);
      const response = await axios.post(`${this.baseURL}/create-payment`, paymentData, {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Subscription payment created successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error creating subscription payment:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to create subscription payment');
    }
  }

  /**
   * Get payment status by invoice ID
   * @param {string} invoiceId - Xendit invoice ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(invoiceId) {
    try {
      console.log('🔄 Getting payment status...', invoiceId);

      const user = JSON.parse(sessionStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      const response = await axios.get(`${this.baseURL}/payment-status/${invoiceId}`, {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Payment status retrieved successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error getting payment status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to get payment status');
    }
  }

  /**
   * Handle payment success redirect
   * @param {string} invoiceId - Xendit invoice ID
   * @returns {Promise<Object>} Payment confirmation
   */
  async handlePaymentSuccess(invoiceId) {
    try {
      console.log('🔄 Handling payment success...', invoiceId);

      const user = JSON.parse(sessionStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      const response = await axios.post(`${this.baseURL}/payment-success`, {
        invoice_id: invoiceId
      }, {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Payment success handled successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error handling payment success:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to handle payment success');
    }
  }

  /**
   * Get vendor subscription details
   * @returns {Promise<Object>} Subscription details
   */
  async getVendorSubscription() {
    try {
      console.log('🔄 Getting vendor subscription...');

      const user = JSON.parse(sessionStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      const response = await axios.get(`${this.baseURL}/vendor-subscription`, {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Vendor subscription retrieved successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Error getting vendor subscription:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to get vendor subscription');
    }
  }
}

const subscriptionService = new SubscriptionService();

export default subscriptionService;

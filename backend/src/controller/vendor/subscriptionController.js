const pool = require('../../db/config');
const xenditService = require('../../services/xenditService');

// Create subscription payment invoice
const createSubscriptionPayment = async (req, res) => {
    try {
        const { plan_name, amount, billing_cycle = 'monthly' } = req.body;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        console.log('🔄 Creating subscription payment...', {
            userId,
            plan_name,
            amount,
            billing_cycle
        });

        // Get vendor details by user_id
        const [vendors] = await pool.query(`
            SELECT v.*, u.fname, u.lname, u.email, u.contact_no
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE v.user_id = ?
        `, [userId]);

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const vendor = vendors[0];
        console.log('👤 Vendor details:', {
            vendor_id: vendor.vendor_id,
            user_id: vendor.user_id,
            store_name: vendor.store_name,
            current_plan: vendor.subscription_plan
        });

        // Create Xendit invoice
        const subscriptionData = {
            vendor_id: vendor.vendor_id,
            vendor_name: `${vendor.fname} ${vendor.lname}`,
            vendor_email: vendor.email,
            vendor_phone: vendor.contact_no,
            plan_name,
            amount: parseFloat(amount),
            billing_cycle,
            features: getPlanFeatures(plan_name)
        };

        // Check if Xendit is configured (for test mode)
        const isTestMode = !process.env.XENDIT_PUBLIC_KEY || !process.env.XENDIT_SECRET_KEY;
        console.log('🔍 Xendit configuration check:', {
            XENDIT_PUBLIC_KEY: process.env.XENDIT_PUBLIC_KEY ? 'SET' : 'NOT SET',
            XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY ? 'SET' : 'NOT SET',
            isTestMode: isTestMode
        });
        
        if (isTestMode) {
        console.log('🧪 Running in test mode - Xendit not configured');
        console.log('📋 Test mode payment details:', {
            vendor_id: vendor.vendor_id,
            plan_name: plan_name,
            amount: amount
        });
        
        // For testing purposes, create a mock payment record and upgrade vendor
        const mockInvoiceId = `test_invoice_${Date.now()}`;
        
        // Create payment record
        await pool.query(`
            INSERT INTO subscription_payments (
                vendor_id, plan_name, amount, payment_status, 
                xendit_invoice_id, payment_method
            ) VALUES (?, ?, ?, 'paid', ?, 'GCASH')
        `, [vendor.vendor_id, plan_name, amount, mockInvoiceId]);

        console.log('✅ Payment record created with ID:', mockInvoiceId);

        // Upgrade vendor plan immediately in test mode
        console.log('🔄 Upgrading vendor plan in test mode...', {
            vendor_id: vendor.vendor_id,
            plan_name: plan_name
        });
        
        try {
            await upgradeVendorPlan(vendor.vendor_id, plan_name);
            console.log('✅ Vendor plan upgraded successfully in test mode');
            
            // Verify the upgrade
            const [updatedVendor] = await pool.query('SELECT subscription_plan, subscription_end_date FROM vendors WHERE vendor_id = ?', [vendor.vendor_id]);
            console.log('✅ Verified vendor upgrade:', updatedVendor[0]);
        } catch (upgradeError) {
            console.error('❌ Error upgrading vendor plan:', upgradeError);
            throw upgradeError;
        }

            res.json({
                success: true,
                message: 'Subscription payment created successfully (Test Mode)',
                data: {
                    invoice_id: mockInvoiceId,
                    invoice_url: `https://test-payment-url.com/${mockInvoiceId}`,
                    amount: amount,
                    plan_name: plan_name,
                    payment_method: 'GCASH',
                    test_mode: true
                }
            });
        } else {
            try {
                const xenditInvoice = await xenditService.createSubscriptionInvoice(subscriptionData);

                // Save payment record
                await pool.query(`
                    INSERT INTO subscription_payments (
                        vendor_id, plan_name, amount, payment_status, 
                        xendit_invoice_id, payment_method
                    ) VALUES (?, ?, ?, 'pending', ?, 'GCASH')
                `, [vendor.vendor_id, plan_name, amount, xenditInvoice.id]);

                console.log('✅ Subscription payment created successfully');

                res.json({
                    success: true,
                    message: 'Subscription payment created successfully',
                    data: {
                        invoice_id: xenditInvoice.id,
                        invoice_url: xenditInvoice.invoice_url,
                        amount: amount,
                        plan_name: plan_name,
                        payment_method: 'GCASH'
                    }
                });
            } catch (xenditError) {
                console.error('❌ Xendit error:', xenditError.message);
                throw xenditError;
            }
        }

    } catch (error) {
        console.error('❌ Error creating subscription payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create subscription payment',
            details: error.message
        });
    }
};

// Handle Xendit webhook for payment confirmation
const handlePaymentWebhook = async (req, res) => {
    try {
        const webhook = req.body;
        
        console.log('🔄 Received Xendit webhook:', webhook.id);

        // Verify webhook signature (optional but recommended)
        // const signature = req.headers['x-xendit-signature'];
        // if (!xenditService.verifyWebhookSignature(webhook, signature)) {
        //     return res.status(400).json({ error: 'Invalid webhook signature' });
        // }

        if (webhook.status === 'PAID') {
            const invoice_id = webhook.id;
            
            // Find the payment record
            const [payments] = await pool.query(`
                SELECT * FROM subscription_payments 
                WHERE xendit_invoice_id = ?
            `, [invoice_id]);

            if (payments.length > 0) {
                const payment = payments[0];
                
                // Update payment status
                await pool.query(`
                    UPDATE subscription_payments 
                    SET payment_status = 'paid', 
                        xendit_payment_id = ?,
                        payment_date = NOW()
                    WHERE xendit_invoice_id = ?
                `, [webhook.payment_id, invoice_id]);

                // Upgrade vendor plan
                await upgradeVendorPlan(payment.vendor_id, payment.plan_name);

                console.log('✅ Payment confirmed and vendor upgraded:', payment.vendor_id);
            }
        }

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Error handling webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook'
        });
    }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
    try {
        const { invoice_id } = req.params;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Get vendor ID from user ID
        const [vendors] = await pool.query(`
            SELECT vendor_id FROM vendors WHERE user_id = ?
        `, [userId]);

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const vendor_id = vendors[0].vendor_id;

        const [payments] = await pool.query(`
            SELECT * FROM subscription_payments 
            WHERE xendit_invoice_id = ? AND vendor_id = ?
        `, [invoice_id, vendor_id]);

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payments[0]
        });

    } catch (error) {
        console.error('❌ Error getting payment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment status'
        });
    }
};

// Helper function to upgrade vendor plan
const upgradeVendorPlan = async (vendor_id, plan_name) => {
    try {
        const features = getPlanFeatures(plan_name);
        const expires_at = new Date();
        expires_at.setMonth(expires_at.getMonth() + 1); // 1 month from now

        const result = await pool.query(`
            UPDATE vendors 
            SET subscription_plan = ?, 
                subscription_end_date = ?,
                flavor_limit = ?,
                drum_limit = ?,
                order_limit = ?
            WHERE vendor_id = ?
        `, [plan_name, expires_at, features.max_flavors, features.max_drums, features.max_orders_per_month, vendor_id]);

        console.log('✅ Vendor plan upgraded successfully:', {
            vendor_id,
            plan_name,
            affected_rows: result[0].affectedRows,
            features: features
        });

    } catch (error) {
        console.error('❌ Error upgrading vendor plan:', error);
        throw error;
    }
};

// Helper function to get plan features
const getPlanFeatures = (plan_name) => {
    const features = {
        'professional': {
            max_flavors: 15,
            max_drums: 15,
            max_orders_per_month: 70,
            priority_support: true
        },
        'premium': {
            max_flavors: -1, // unlimited
            max_drums: -1, // unlimited
            max_orders_per_month: -1, // unlimited
            priority_support: true
        }
    };

    return features[plan_name.toLowerCase()] || features['professional'];
};

module.exports = {
    createSubscriptionPayment,
    handlePaymentWebhook,
    getPaymentStatus
};

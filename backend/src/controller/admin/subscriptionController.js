const pool = require('../../db/config');

// Get all subscription plans
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = [
            {
                plan_id: 'free',
                plan_name: 'Free Plan',
                price: 0,
                flavor_limit: 5,
                drum_limit: 5,
                order_limit: 50,
                features: ['Basic analytics', 'Standard support', 'Basic store listing']
            },
            {
                plan_id: 'professional',
                plan_name: 'Professional Plan',
                price: 999,
                flavor_limit: 15,
                drum_limit: 15,
                order_limit: 200,
                features: ['Advanced analytics', 'Priority support', 'Featured listing', 'Custom store branding']
            },
            {
                plan_id: 'premium',
                plan_name: 'Premium Plan',
                price: 1999,
                flavor_limit: -1, // -1 means unlimited
                drum_limit: -1,
                order_limit: -1,
                features: ['All Professional features', 'Advanced marketing tools', 'Dedicated account manager']
            }
        ];

        res.json({
            success: true,
            plans: plans
        });

    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription plans'
        });
    }
};

// Get vendor subscription details
const getVendorSubscription = async (req, res) => {
    try {
        const { vendor_id } = req.params;

        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.subscription_plan,
                v.flavor_limit,
                v.drum_limit,
                v.order_limit,
                v.subscription_start_date,
                v.subscription_end_date,
                u.fname,
                u.lname,
                u.email
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE v.vendor_id = ?
        `, [vendor_id]);

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const vendor = vendors[0];

        // Get current usage
        const [flavorCount] = await pool.query(
            'SELECT COUNT(*) as count FROM flavors WHERE vendor_id = ?',
            [vendor_id]
        );

        // Get vendor's drum stock from vendor_drum_pricing table
        const [drumCount] = await pool.query(`
            SELECT 
                COALESCE(SUM(stock), 0) as count 
            FROM vendor_drum_pricing 
            WHERE vendor_id = ?
        `, [vendor_id]);

        const [orderCount] = await pool.query(`
            SELECT COUNT(*) as count FROM orders 
            WHERE vendor_id = ? 
            AND MONTH(created_at) = MONTH(CURDATE()) 
            AND YEAR(created_at) = YEAR(CURDATE())
        `, [vendor_id]);

        res.json({
            success: true,
            subscription: {
                ...vendor,
                current_usage: {
                    flavors: flavorCount[0].count,
                    drums: drumCount[0].count,
                    orders_this_month: orderCount[0].count
                }
            }
        });

    } catch (error) {
        console.error('Error fetching vendor subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor subscription'
        });
    }
};

// Update vendor subscription plan
const updateVendorSubscription = async (req, res) => {
    try {
        const { vendor_id } = req.params;
        const { subscription_plan } = req.body;

        // Validate subscription plan
        const validPlans = ['free', 'professional', 'premium'];
        if (!validPlans.includes(subscription_plan)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription plan'
            });
        }

        // Set limits based on plan
        let flavor_limit, drum_limit, order_limit;
        switch (subscription_plan) {
            case 'free':
                flavor_limit = 5;
                drum_limit = 5;
                order_limit = 50;
                break;
            case 'professional':
                flavor_limit = 15;
                drum_limit = 15;
                order_limit = 200;
                break;
            case 'premium':
                flavor_limit = -1; // unlimited
                drum_limit = -1;
                order_limit = -1;
                break;
        }

        // Update vendor subscription
        await pool.query(`
            UPDATE vendors 
            SET 
                subscription_plan = ?,
                flavor_limit = ?,
                drum_limit = ?,
                order_limit = ?,
                subscription_start_date = CURDATE(),
                subscription_end_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
            WHERE vendor_id = ?
        `, [subscription_plan, flavor_limit, drum_limit, order_limit, vendor_id]);

        res.json({
            success: true,
            message: 'Subscription plan updated successfully',
            subscription: {
                plan: subscription_plan,
                flavor_limit,
                drum_limit,
                order_limit
            }
        });

    } catch (error) {
        console.error('Error updating vendor subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update subscription plan'
        });
    }
};

// Get all vendors with subscription info
const getAllVendorSubscriptions = async (req, res) => {
    try {
        const [vendors] = await pool.query(`
            SELECT 
                v.vendor_id,
                v.store_name,
                v.subscription_plan,
                v.flavor_limit,
                v.drum_limit,
                v.order_limit,
                v.subscription_start_date,
                v.subscription_end_date,
                u.fname,
                u.lname,
                u.email,
                u.contact_no
            FROM vendors v
            LEFT JOIN users u ON v.user_id = u.user_id
            ORDER BY v.created_at DESC
        `);

        // Get usage for each vendor
        const vendorsWithUsage = await Promise.all(
            vendors.map(async (vendor) => {
                const [flavorCount] = await pool.query(
                    'SELECT COUNT(*) as count FROM flavors WHERE vendor_id = ?',
                    [vendor.vendor_id]
                );

                // Get vendor's drum stock from vendor_drum_pricing table
                const [drumCount] = await pool.query(`
                    SELECT 
                        COALESCE(SUM(stock), 0) as count 
                    FROM vendor_drum_pricing 
                    WHERE vendor_id = ?
                `, [vendor.vendor_id]);

                const [orderCount] = await pool.query(`
                    SELECT COUNT(*) as count FROM orders 
                    WHERE vendor_id = ? 
                    AND MONTH(created_at) = MONTH(CURDATE()) 
                    AND YEAR(created_at) = YEAR(CURDATE())
                `, [vendor.vendor_id]);

                return {
                    ...vendor,
                    current_usage: {
                        flavors: flavorCount[0].count,
                        drums: drumCount[0].count,
                        orders_this_month: orderCount[0].count
                    }
                };
            })
        );

        res.json({
            success: true,
            vendors: vendorsWithUsage
        });

    } catch (error) {
        console.error('Error fetching vendor subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor subscriptions'
        });
    }
};

// Get subscription revenue summary
const getSubscriptionRevenue = async (req, res) => {
    try {
        const [revenue] = await pool.query(`
            SELECT 
                subscription_plan,
                COUNT(*) as vendor_count,
                CASE 
                    WHEN subscription_plan = 'free' THEN 0
                    WHEN subscription_plan = 'professional' THEN 999
                    WHEN subscription_plan = 'premium' THEN 1999
                END as monthly_price,
                COUNT(*) * CASE 
                    WHEN subscription_plan = 'free' THEN 0
                    WHEN subscription_plan = 'professional' THEN 999
                    WHEN subscription_plan = 'premium' THEN 1999
                END as monthly_revenue
            FROM vendors 
            GROUP BY subscription_plan
        `);

        const totalRevenue = revenue.reduce((sum, plan) => sum + plan.monthly_revenue, 0);
        const totalVendors = revenue.reduce((sum, plan) => sum + plan.vendor_count, 0);

        res.json({
            success: true,
            revenue_summary: {
                plans: revenue,
                total_vendors: totalVendors,
                total_monthly_revenue: totalRevenue
            }
        });

    } catch (error) {
        console.error('Error fetching subscription revenue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription revenue'
        });
    }
};

module.exports = {
    getSubscriptionPlans,
    getVendorSubscription,
    updateVendorSubscription,
    getAllVendorSubscriptions,
    getSubscriptionRevenue
};
